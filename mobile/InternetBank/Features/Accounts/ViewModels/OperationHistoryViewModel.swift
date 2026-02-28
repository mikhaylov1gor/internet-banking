import Foundation

@Observable
final class OperationHistoryViewModel {
    var operations: [AccountOperation] = []
    var isLoading: Bool = false
    var errorMessage: String?

    private let accountRepository: AccountRepositoryProtocol
    private let account: Account

    init(accountRepository: AccountRepositoryProtocol, account: Account) {
        self.accountRepository = accountRepository
        self.account = account
    }

    func load() async {
        isLoading = true
        do {
            operations = try await accountRepository.getOperations(accountId: account.id)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
