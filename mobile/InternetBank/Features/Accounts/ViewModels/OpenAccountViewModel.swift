import Foundation

@Observable
final class OpenAccountViewModel {
    var isLoading: Bool = false
    var errorMessage: String?

    var onSuccess: ((Account) -> Void)?

    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String

    init(accountRepository: AccountRepositoryProtocol, clientId: String) {
        self.accountRepository = accountRepository
        self.clientId = clientId
    }

    func openAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            let account = try await accountRepository.openAccount(clientId: clientId)
            onSuccess?(account)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
