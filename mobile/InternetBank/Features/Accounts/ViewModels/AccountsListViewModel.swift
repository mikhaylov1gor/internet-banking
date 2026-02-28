import Foundation

@Observable
final class AccountsListViewModel {
    var accounts: [Account] = []
    var isLoading: Bool = false
    var errorMessage: String?

    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String

    init(accountRepository: AccountRepositoryProtocol, clientId: String) {
        self.accountRepository = accountRepository
        self.clientId = clientId
    }

    func loadAccounts() async {
        isLoading = true
        errorMessage = nil
        do {
            accounts = try await accountRepository.getAccounts(clientId: clientId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
