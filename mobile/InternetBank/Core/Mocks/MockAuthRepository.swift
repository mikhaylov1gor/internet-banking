import Foundation

final class MockAuthRepository: AuthRepositoryProtocol {
    private let authService: AuthServiceProtocol

    init(authService: AuthServiceProtocol) {
        self.authService = authService
    }

    func login(login: String, password: String) async throws -> AuthResult {
        try await Task.sleep(nanoseconds: 400_000_000)
        let userId = login.isEmpty ? "mock-user" : login
        authService.saveToken("mock-token-\(userId)")
        authService.saveUserId(userId)
        return AuthResult(userId: userId, token: "mock-token-\(userId)")
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
