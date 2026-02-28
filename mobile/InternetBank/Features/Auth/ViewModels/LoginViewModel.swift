import Foundation

@Observable
final class LoginViewModel {
    var login: String = ""
    var password: String = ""
    var isLoading: Bool = false
    var errorMessage: String?

    var onLoginSuccess: (() -> Void)?

    private let authRepository: AuthRepositoryProtocol

    init(authRepository: AuthRepositoryProtocol) {
        self.authRepository = authRepository
    }

    func signIn() async {
        guard !login.isEmpty, !password.isEmpty else {
            errorMessage = "Заполните все поля"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            _ = try await authRepository.login(login: login, password: password)
            onLoginSuccess?()
        } catch {
            errorMessage = "Ошибка входа: \(error.localizedDescription)"
        }
        isLoading = false
    }
}
