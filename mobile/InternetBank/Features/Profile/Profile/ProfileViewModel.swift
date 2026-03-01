import Foundation

@Observable
final class ProfileViewModel {
    var isLoading = false

    private let authRepository: AuthRepositoryProtocol
    private let clientId: String

    init(authRepository: AuthRepositoryProtocol, clientId: String) {
        self.authRepository = authRepository
        self.clientId = clientId
    }

    func logout() {
        authRepository.logout()
    }
}
