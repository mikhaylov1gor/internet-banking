import Foundation

@Observable
final class AccountDetailViewModel {
    var account: Account
    var isLoading = false
    var errorMessage: String?

    private let accountRepository: AccountRepositoryProtocol

    init(accountRepository: AccountRepositoryProtocol, account: Account) {
        self.accountRepository = accountRepository
        self.account = account
    }

    func refresh() async {
        isLoading = true
        do {
            if let updated = try await accountRepository.getAccount(id: account.id) {
                account = updated
            }
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
