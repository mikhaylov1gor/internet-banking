import Foundation

final class MockAuthRepository: AuthRepositoryProtocol {
    private let authService: AuthServiceProtocol

    init(authService: AuthServiceProtocol) {
        self.authService = authService
    }

    func login(email: String, password: String) async throws -> AuthResult {
        try await Task.sleep(nanoseconds: 400_000_000)
        let userId = email.isEmpty ? "mock-user" : email
        authService.saveToken("mock-token-\(userId)")
        authService.saveUserId(userId)
        return AuthResult(userId: userId, token: "mock-token-\(userId)")
    }

    func completeWebAuth(accessToken: String, refreshToken: String, userId: String) {
        authService.saveToken(accessToken)
        authService.saveRefreshToken(refreshToken)
        authService.saveUserId(userId)
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
