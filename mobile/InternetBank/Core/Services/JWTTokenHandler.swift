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
        guard let url = APIClient.resolveURL(path: AuthEndpoints.refresh, baseURL: baseURL) else {
            invalidateSession()
            throw APIError.sessionExpired
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(IdempotencyKey.generate(), forHTTPHeaderField: IdempotencyKey.headerField)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let body = RefreshTokenRequest(refreshToken: refreshToken)
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(body)
        #if DEBUG
        APILogger.logRequest(request)
        let refreshLogStart = CFAbsoluteTimeGetCurrent()
        #endif
        let (data, response) = try await session.data(for: request)
        #if DEBUG
        if let httpResponse = response as? HTTPURLResponse {
            APILogger.logResponse(
                request: request,
                response: httpResponse,
                data: data,
                duration: CFAbsoluteTimeGetCurrent() - refreshLogStart)
        }
        #endif
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
        let loginResponse: LoginResponse
        do {
            loginResponse = try decoder.decode(LoginResponse.self, from: data)
        } catch {
            invalidateSession()
            throw APIError.responseDecodingFailed(error.localizedDescription)
        }
        lock.lock()
        authService.saveToken(loginResponse.token.trimmingCharacters(in: .whitespacesAndNewlines))
        if let refresh = loginResponse.refreshToken?.trimmingCharacters(in: .whitespacesAndNewlines), !refresh.isEmpty {
            authService.saveRefreshToken(refresh)
        }
        authService.saveUserId(loginResponse.userId.trimmingCharacters(in: .whitespacesAndNewlines))
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
