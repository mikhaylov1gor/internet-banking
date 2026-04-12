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
    private let baseURL: URL
    private let session: URLSession
    private let tokenHandler: TokenHandlerProtocol?
    private let retryConfiguration: APIRetryConfiguration?
    private let retryPolicy: APIRetryPolicy

    init(
        baseURL: URL,
        session: URLSession = .shared,
        tokenHandler: TokenHandlerProtocol? = nil,
        retryConfiguration: APIRetryConfiguration? = .default,
        retryPolicy: APIRetryPolicy = DefaultAPIRetryPolicy())
    {
        self.baseURL = baseURL
        self.session = session
        self.tokenHandler = tokenHandler
        self.retryConfiguration = retryConfiguration
        self.retryPolicy = retryPolicy
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
        let idempotencyKey = IdempotencyKey.generate()
        let maxAttempts = max(1, retryConfiguration?.maxAttempts ?? 1)
        var lastTransportError: Error?

        attemptLoop: for attempt in 0 ..< maxAttempts {
            if attempt > 0, let cfg = retryConfiguration {
                let ns = retryPolicy.backoffNanoseconds(attemptIndex: attempt - 1, configuration: cfg)
                try await Task.sleep(nanoseconds: ns)
            }

            var request = try makeRequest(
                path: path,
                method: method,
                body: body,
                requiresAuth: requiresAuth,
                idempotencyKey: idempotencyKey)

            let first: (Data, HTTPURLResponse)
            do {
                first = try await sendLoggedRequest(request)
            } catch {
                lastTransportError = error
                if attempt < maxAttempts - 1, retryPolicy.shouldRetryTransportError(error) {
                    continue attemptLoop
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
                    idempotencyKey: idempotencyKey)
                do {
                    (data, httpResponse) = try await sendLoggedRequest(request)
                } catch {
                    lastTransportError = error
                    if attempt < maxAttempts - 1, retryPolicy.shouldRetryTransportError(error) {
                        continue attemptLoop
                    }
                    throw error
                }
            }

            if (200 ... 299).contains(httpResponse.statusCode) {
                return (data, httpResponse)
            }

            if attempt < maxAttempts - 1, retryPolicy.shouldRetryHTTPStatus(httpResponse.statusCode) {
                continue attemptLoop
            }

            throw parseError(data: data, statusCode: httpResponse.statusCode)
        }

        throw lastTransportError ?? APIError.invalidResponse
    }

    private func sendLoggedRequest(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        #if DEBUG
        APILogger.logRequest(request)
        let t0 = CFAbsoluteTimeGetCurrent()
        #endif
        let (data, urlResponse) = try await session.data(for: request)
        #if DEBUG
        let elapsed = CFAbsoluteTimeGetCurrent() - t0
        #endif
        guard let httpResponse = urlResponse as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        #if DEBUG
        APILogger.logResponse(request: request, response: httpResponse, data: data, duration: elapsed)
        #endif
        return (data, httpResponse)
    }

    private func makeRequest(
        path: String,
        method: String,
        body: Encodable?,
        requiresAuth: Bool,
        idempotencyKey: String) throws -> URLRequest
    {
        guard let url = Self.resolveURL(path: path, baseURL: baseURL) else {
            throw APIError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(idempotencyKey, forHTTPHeaderField: IdempotencyKey.headerField)
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

    var errorDescription: String? {
        switch self {
            case .invalidResponse:
                return "Некорректный ответ сервера"
            case .sessionExpired:
                return "Сессия истекла"
            case let .responseDecodingFailed(detail):
                return "Ответ API не распознан. \(detail)"
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
