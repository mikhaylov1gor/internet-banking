import Foundation

@Observable
final class LoginViewModel {
    var email = ""
    var password = ""
    var isLoading = false
    var errorMessage: String?

    var onLoginSuccess: (() -> Void)?

    private let authRepository: AuthRepositoryProtocol

    init(authRepository: AuthRepositoryProtocol) {
        self.authRepository = authRepository
    }

    func signIn() async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Заполните все поля"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            _ = try await authRepository.login(email: email, password: password)
            onLoginSuccess?()
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
