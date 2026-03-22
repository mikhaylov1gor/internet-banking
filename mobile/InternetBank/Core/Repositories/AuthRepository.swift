import Foundation

final class AuthRepository: AuthRepositoryProtocol {
    private let apiClient: APIClient
    private let authService: AuthServiceProtocol
    private let tokenHandler: JWTTokenHandlerProtocol?

    init(apiClient: APIClient, authService: AuthServiceProtocol, tokenHandler: JWTTokenHandlerProtocol? = nil) {
        self.apiClient = apiClient
        self.authService = authService
        self.tokenHandler = tokenHandler
    }

    func login(email: String, password: String) async throws -> AuthResult {
        let request = LoginRequest(email: email, password: password)
        let response: LoginResponse = try await apiClient.request(
            path: AuthEndpoints.login,
            method: "POST",
            body: request,
            requiresAuth: false)
        authService.saveToken(response.token.trimmingCharacters(in: .whitespacesAndNewlines))
        if let refresh = response.refreshToken?.trimmingCharacters(in: .whitespacesAndNewlines), !refresh.isEmpty {
            authService.saveRefreshToken(refresh)
        }
        authService.saveUserId(response.userId.trimmingCharacters(in: .whitespacesAndNewlines))
        return AuthResult(userId: response.userId, token: response.token)
    }

    func completeWebAuth(accessToken: String, refreshToken: String, userId: String) {
        let access = accessToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let refresh = refreshToken.trimmingCharacters(in: .whitespacesAndNewlines)
        let uid = userId.trimmingCharacters(in: .whitespacesAndNewlines)
        authService.saveToken(access)
        authService.saveRefreshToken(refresh)
        authService.saveUserId(uid)
    }

    func logout() {
        tokenHandler?.invalidateSession()
        if tokenHandler == nil {
            authService.clearToken()
            authService.clearRefreshToken()
            authService.clearUserId()
        }
    }

    var currentUserId: String? {
        authService.getUserId()
    }

    var isAuthenticated: Bool {
        authService.getToken() != nil && currentUserId != nil
    }
}
