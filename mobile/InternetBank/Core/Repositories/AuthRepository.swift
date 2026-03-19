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
        authService.saveToken(response.token)
        if let refresh = response.refreshToken {
            authService.saveRefreshToken(refresh)
        }
        authService.saveUserId(response.userId)
        return AuthResult(userId: response.userId, token: response.token)
    }

    func completeWebAuth(accessToken: String, refreshToken: String, userId: String) {
        authService.saveToken(accessToken)
        authService.saveRefreshToken(refreshToken)
        authService.saveUserId(userId)
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
