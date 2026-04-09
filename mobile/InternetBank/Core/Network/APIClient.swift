import Foundation

protocol TokenHandlerProtocol: AnyObject {
    func getAccessToken() -> String?
    func refreshTokens() async throws
}

final class APIClient {
    private let baseURL: URL
    private let session: URLSession
    private let tokenHandler: TokenHandlerProtocol?

    init(baseURL: URL, session: URLSession = .shared, tokenHandler: TokenHandlerProtocol? = nil) {
        self.baseURL = baseURL
        self.session = session
        self.tokenHandler = tokenHandler
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
        var request = try makeRequest(path: path, method: method, body: body, requiresAuth: requiresAuth)
        let (data, urlResponse) = try await session.data(for: request)
        guard let httpResponse = urlResponse as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if httpResponse.statusCode == 401, requiresAuth, tokenHandler != nil {
            try await tokenHandler?.refreshTokens()
            request = try makeRequest(path: path, method: method, body: body, requiresAuth: true)
            let (retryData, retryResponse) = try await session.data(for: request)
            guard let retryHttpResponse = retryResponse as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            guard (200 ... 299).contains(retryHttpResponse.statusCode) else {
                throw parseError(data: retryData, statusCode: retryHttpResponse.statusCode)
            }
            return (retryData, retryHttpResponse)
        }
        guard (200 ... 299).contains(httpResponse.statusCode) else {
            throw parseError(data: data, statusCode: httpResponse.statusCode)
        }
        return (data, httpResponse)
    }

    private func makeRequest(path: String, method: String, body: Encodable?, requiresAuth: Bool) throws -> URLRequest {
        guard let url = Self.resolveURL(path: path, baseURL: baseURL) else {
            throw APIError.invalidResponse
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
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
