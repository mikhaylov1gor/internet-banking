import Foundation

protocol JWTTokenHandlerProtocol: TokenHandlerProtocol {
    func invalidateSession()
}

final class JWTTokenHandler: JWTTokenHandlerProtocol {
    private let authService: AuthServiceProtocol
    private let sessionState: SessionState
    private let baseURL: URL
    private let session: URLSession
    private let lock = NSLock()

    init(
        authService: AuthServiceProtocol,
        sessionState: SessionState,
        baseURL: URL,
        session: URLSession = .shared)
    {
        self.authService = authService
        self.sessionState = sessionState
        self.baseURL = baseURL
        self.session = session
    }

    func getAccessToken() -> String? {
        authService.getToken()
    }

    func refreshTokens() async throws {
        guard let refreshToken = authService.getRefreshToken(), !refreshToken.isEmpty else {
            invalidateSession()
            throw APIError.sessionExpired
        }
        guard let url = URL(string: AuthEndpoints.refresh, relativeTo: baseURL) else {
            invalidateSession()
            throw APIError.sessionExpired
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let body = RefreshTokenRequest(refreshToken: refreshToken)
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(body)
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            invalidateSession()
            throw APIError.sessionExpired
        }
        guard (200 ... 299).contains(httpResponse.statusCode) else {
            invalidateSession()
            throw APIError.sessionExpired
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let loginResponse = try decoder.decode(LoginResponse.self, from: data)
        lock.lock()
        authService.saveToken(loginResponse.token)
        if let refresh = loginResponse.refreshToken {
            authService.saveRefreshToken(refresh)
        }
        authService.saveUserId(loginResponse.userId)
        lock.unlock()
    }

    func invalidateSession() {
        lock.lock()
        authService.clearToken()
        authService.clearRefreshToken()
        authService.clearUserId()
        lock.unlock()
        DispatchQueue.main.async {
            self.sessionState.markSessionExpired()
        }
    }
}
