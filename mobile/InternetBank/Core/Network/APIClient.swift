import Foundation

enum IdempotencyKey {
    static let headerField = "Idempotency-Key"

    static func generate() -> String {
        UUID().uuidString
    }
}

protocol TokenHandlerProtocol: AnyObject {
    func getAccessToken() -> String?
    func refreshTokens() async throws
}

final class APIClient {
    private enum AttemptOutcome {
        case success(Data, HTTPURLResponse)
        case retryTransport(Error)
        case retryHTTP(Data, HTTPURLResponse)
    }

    private final class RetryFailureLedger {
        var recordedWhileRetrying = false
    }

    private static let fallbackRetryLimitWithoutCircuitBreaker = 32

    private let baseURL: URL
    private let session: URLSession
    private let tokenHandler: TokenHandlerProtocol?
    private let retryConfiguration: APIRetryConfiguration?
    private let retryPolicy: APIRetryPolicy
    private let circuitBreaker: (any APICircuitBreaker)?

    init(
        baseURL: URL,
        session: URLSession = .shared,
        tokenHandler: TokenHandlerProtocol? = nil,
        retryConfiguration: APIRetryConfiguration? = .default,
        retryPolicy: APIRetryPolicy = DefaultAPIRetryPolicy(),
        circuitBreaker: (any APICircuitBreaker)? = nil)
    {
        self.baseURL = baseURL
        self.session = session
        self.tokenHandler = tokenHandler
        self.retryConfiguration = retryConfiguration
        self.retryPolicy = retryPolicy
        self.circuitBreaker = circuitBreaker
    }

    func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        requiresAuth: Bool = true) async throws -> T
    {
        let (data, _) = try await execute(path: path, method: method, body: body, requiresAuth: requiresAuth)
        return try decodeResponse(T.self, from: data)
    }

    func requestEmpty(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        requiresAuth: Bool = true) async throws
    {
        _ = try await execute(path: path, method: method, body: body, requiresAuth: requiresAuth)
    }

    private func execute(
        path: String,
        method: String,
        body: Encodable?,
        requiresAuth: Bool) async throws -> (Data, HTTPURLResponse)
    {
        if let circuitBreaker {
            try await circuitBreaker.beforeRequest()
        }
        let traceID = APITracing.newTraceID()
        let ledger = RetryFailureLedger()
        do {
            let result = try await executeWithRetries(
                path: path,
                method: method,
                body: body,
                requiresAuth: requiresAuth,
                ledger: ledger,
                traceID: traceID)
            await circuitBreaker?.recordSuccess()
            return result
        } catch {
            if let circuitBreaker, Self.shouldTripCircuit(for: error), !ledger.recordedWhileRetrying {
                await circuitBreaker.recordFailure()
            }
            throw error
        }
    }

    private static func shouldTripCircuit(for error: Error) -> Bool {
        if let api = error as? APIError {
            switch api {
            case .sessionExpired, .responseDecodingFailed, .circuitOpen:
                return false
            case .invalidResponse:
                return true
            case let .serverError(code, _):
                if (400 ..< 500).contains(code), code != 408, code != 429 {
                    return false
                }
                return code >= 408
            }
        }
        if let urlError = error as? URLError {
            return DefaultAPIRetryPolicy().shouldRetryTransportError(urlError)
        }
        return false
    }

    private func executeWithRetries(
        path: String,
        method: String,
        body: Encodable?,
        requiresAuth: Bool,
        ledger: RetryFailureLedger,
        traceID: String) async throws -> (Data, HTTPURLResponse)
    {
        let idempotencyKey = IdempotencyKey.generate()

        guard let backoffCfg = retryConfiguration else {
            switch try await performAttempt(
                path: path,
                method: method,
                body: body,
                requiresAuth: requiresAuth,
                idempotencyKey: idempotencyKey,
                traceID: traceID)
            {
            case let .success(data, response):
                return (data, response)
            case let .retryTransport(error):
                throw error
            case let .retryHTTP(data, response):
                throw parseError(data: data, statusCode: response.statusCode)
            }
        }

        var attemptIndex = 0
        var lastTransportError: Error?
        var lastRetryHTTP: (data: Data, status: Int)?

        while true {
            if attemptIndex > 0 {
                try await circuitBreaker?.beforeRequest()
                let ns = retryPolicy.backoffNanoseconds(attemptIndex: attemptIndex - 1, configuration: backoffCfg)
                try await Task.sleep(nanoseconds: ns)
            }

            if circuitBreaker == nil, attemptIndex >= Self.fallbackRetryLimitWithoutCircuitBreaker {
                if let error = lastTransportError {
                    throw error
                }
                if let last = lastRetryHTTP {
                    throw parseError(data: last.data, statusCode: last.status)
                }
                throw APIError.invalidResponse
            }

            switch try await performAttempt(
                path: path,
                method: method,
                body: body,
                requiresAuth: requiresAuth,
                idempotencyKey: idempotencyKey,
                traceID: traceID)
            {
            case let .success(data, response):
                return (data, response)
            case let .retryTransport(error):
                lastTransportError = error
                if Self.shouldTripCircuit(for: error) {
                    ledger.recordedWhileRetrying = true
                    await circuitBreaker?.recordFailure()
                }
                attemptIndex += 1
                continue
            case let .retryHTTP(data, response):
                lastRetryHTTP = (data, response.statusCode)
                let trip = Self.shouldTripCircuit(
                    for: APIError.serverError(statusCode: response.statusCode, message: nil))
                if trip {
                    ledger.recordedWhileRetrying = true
                    await circuitBreaker?.recordFailure()
                }
                attemptIndex += 1
                continue
            }
        }
    }

    private func performAttempt(
        path: String,
        method: String,
        body: Encodable?,
        requiresAuth: Bool,
        idempotencyKey: String,
        traceID: String) async throws -> AttemptOutcome
    {
        var request = try makeRequest(
            path: path,
            method: method,
            body: body,
            requiresAuth: requiresAuth,
            idempotencyKey: idempotencyKey,
            traceID: traceID)

        let first: (Data, HTTPURLResponse)
        do {
            first = try await sendLoggedRequest(request)
        } catch {
            if retryPolicy.shouldRetryTransportError(error) {
                return .retryTransport(error)
            }
            throw error
        }

        var (data, httpResponse) = first

        if httpResponse.statusCode == 401, requiresAuth, tokenHandler != nil {
            try await tokenHandler?.refreshTokens()
            request = try makeRequest(
                path: path,
                method: method,
                body: body,
                requiresAuth: true,
                idempotencyKey: idempotencyKey,
                traceID: traceID)
            do {
                (data, httpResponse) = try await sendLoggedRequest(request)
            } catch {
                if retryPolicy.shouldRetryTransportError(error) {
                    return .retryTransport(error)
                }
                throw error
            }
        }

        if (200 ... 299).contains(httpResponse.statusCode) {
            return .success(data, httpResponse)
        }

        if retryPolicy.shouldRetryHTTPStatus(httpResponse.statusCode) {
            return .retryHTTP(data, httpResponse)
        }

        throw parseError(data: data, statusCode: httpResponse.statusCode)
    }

    private func sendLoggedRequest(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        let t0 = CFAbsoluteTimeGetCurrent()
        #if DEBUG
        APILogger.logRequest(request)
        #endif
        let data: Data
        let urlResponse: URLResponse
        do {
            (data, urlResponse) = try await session.data(for: request)
        } catch {
            #if DEBUG
            APILogger.logTransportFailure(
                request: request,
                error: error,
                duration: CFAbsoluteTimeGetCurrent() - t0)
            #endif
            throw error
        }
        let elapsed = CFAbsoluteTimeGetCurrent() - t0
        guard let httpResponse = urlResponse as? HTTPURLResponse else {
            #if DEBUG
            APILogger.logTransportFailure(
                request: request,
                error: APIError.invalidResponse,
                duration: elapsed)
            #endif
            throw APIError.invalidResponse
        }
        #if DEBUG
        APILogger.logResponse(request: request, response: httpResponse, data: data, duration: elapsed)
        #endif
        let trace = request.value(forHTTPHeaderField: APITracing.traceIDHeaderField)
        let ms = max(0, Int((elapsed * 1000).rounded()))
        APITracing.logSpan(
            traceID: trace,
            method: request.httpMethod ?? "?",
            url: request.url?.absoluteString ?? "?",
            statusCode: httpResponse.statusCode,
            durationMs: ms)
        return (data, httpResponse)
    }

    private func makeRequest(
        path: String,
        method: String,
        body: Encodable?,
        requiresAuth: Bool,
        idempotencyKey: String,
        traceID: String) throws -> URLRequest
    {
        guard let url = Self.resolveURL(path: path, baseURL: baseURL) else {
            throw APIError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(idempotencyKey, forHTTPHeaderField: IdempotencyKey.headerField)
        request.setValue(traceID, forHTTPHeaderField: APITracing.traceIDHeaderField)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if requiresAuth, let token = tokenHandler?.getAccessToken() {
            let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
            request.setValue("Bearer \(trimmed)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            let encoder = JSONEncoder()
            encoder.keyEncodingStrategy = .convertToSnakeCase
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }
        return request
    }

    private func decodeResponse<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.responseDecodingFailed(error.localizedDescription)
        }
    }

    private func parseError(data: Data, statusCode: Int) -> APIError {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
            return APIError.serverError(statusCode: statusCode, message: errorResponse.error)
        }
        return APIError.serverError(statusCode: statusCode, message: nil)
    }

    static func resolveURL(path: String, baseURL: URL) -> URL? {
        if path.hasPrefix("http://") || path.hasPrefix("https://") {
            return URL(string: path)
        }
        var baseString = baseURL.absoluteString
        while baseString.last == "/" {
            baseString.removeLast()
        }
        let normalizedPath = path.hasPrefix("/") ? path : "/" + path
        return URL(string: baseString + normalizedPath)
    }
}

private struct AnyEncodable: Encodable {
    private let encode: (Encoder) throws -> Void
    init<T: Encodable>(_ value: T) {
        encode = value.encode
    }

    func encode(to encoder: Encoder) throws {
        try encode(encoder)
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case serverError(statusCode: Int, message: String?)
    case sessionExpired
    case responseDecodingFailed(String)
    case circuitOpen(retryAfter: TimeInterval?)

    var errorDescription: String? {
        switch self {
            case .invalidResponse:
                return "Некорректный ответ сервера"
            case .sessionExpired:
                return "Сессия истекла"
            case let .responseDecodingFailed(detail):
                return "Ответ API не распознан. \(detail)"
            case let .circuitOpen(after):
                if let s = after, s > 0 {
                    let sec = max(1, Int(ceil(s)))
                    return "Сервис временно недоступен. Повторите через \(sec) с."
                }
                return "Сервис временно недоступен. Попробуйте позже."
            case let .serverError(code, message):
                if let msg = message, !msg.isEmpty {
                    return msg
                }
                switch code {
                    case 400: return "Неверные данные запроса"
                    case 401: return "Требуется авторизация"
                    case 403: return "Доступ запрещён"
                    case 404: return "Не найдено"
                    case 502: return "Шлюз недоступен (502). Проверьте, что Core/Credits/AppSettings запущены в Docker."
                    case 503: return "Сервис временно недоступен (503)"
                    case 504: return "Таймаут шлюза (504)"
                    case 500 ... 599: return "Ошибка сервера (\(code))"
                    default: return "Ошибка (\(code))"
                }
        }
    }
}
