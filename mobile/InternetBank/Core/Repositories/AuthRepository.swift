import Foundation

final class AuthRepository: AuthRepositoryProtocol {
    private let authAPI: APIClient
    private let authService: AuthServiceProtocol

    init(authAPI: APIClient, authService: AuthServiceProtocol) {
        self.authAPI = authAPI
        self.authService = authService
    }

    func login(login: String, password: String) async throws -> AuthResult {
        let request = LoginRequest(login: login, password: password)
        let response: LoginResponse = try await authAPI.request(
            path: AuthEndpoints.login,
            method: "POST",
            body: request
        )
        authService.saveToken(response.token)
        authService.saveUserId(response.userId)
        return AuthResult(userId: response.userId, token: response.token)
    }

    func logout() {
        authService.clearToken()
        authService.clearUserId()
    }

    var currentUserId: String? {
        authService.getUserId()
    }

    var isAuthenticated: Bool {
        authService.getToken() != nil && currentUserId != nil
    }
}
