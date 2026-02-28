import Foundation

@Observable
final class CloseAccountViewModel {
    var isLoading: Bool = false
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
            try await accountRepository.closeAccount(id: account.id)
            onSuccess?()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
