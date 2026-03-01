import Foundation

final class AuthRepository: AuthRepositoryProtocol {
    private let apiClient: APIClient
    private let authService: AuthServiceProtocol

    init(apiClient: APIClient, authService: AuthServiceProtocol) {
        self.apiClient = apiClient
        self.authService = authService
    }

    func login(email: String, password: String) async throws -> AuthResult {
        let request = LoginRequest(email: email, password: password)
        let response: LoginResponse = try await apiClient.request(
            path: AuthEndpoints.login,
            method: "POST",
            body: request)
        authService.saveToken(response.token)
        if let refresh = response.refreshToken {
            authService.saveRefreshToken(refresh)
        }
        authService.saveUserId(response.userId)
        return AuthResult(userId: response.userId, token: response.token)
    }

    func logout() {
        authService.clearToken()
        authService.clearRefreshToken()
        authService.clearUserId()
    }

    var currentUserId: String? {
        authService.getUserId()
    }

    var isAuthenticated: Bool {
        authService.getToken() != nil && currentUserId != nil
    }
}
