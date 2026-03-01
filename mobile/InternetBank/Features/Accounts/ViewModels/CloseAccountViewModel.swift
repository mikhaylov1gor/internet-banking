import Foundation

@Observable
final class CloseAccountViewModel {
    var isLoading = false
    var errorMessage: String?

    var onSuccess: (() -> Void)?

    private let accountRepository: AccountRepositoryProtocol
    private let account: Account

    init(accountRepository: AccountRepositoryProtocol, account: Account) {
        self.accountRepository = accountRepository
        self.account = account
    }

    func closeAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            try await accountRepository.closeAccount(id: account.id, clientId: account.clientId)
            onSuccess?()
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
