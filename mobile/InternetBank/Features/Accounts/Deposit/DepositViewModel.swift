import Foundation

@Observable
final class DepositViewModel {
    var amount = ""
    var isLoading = false
    var errorMessage: String?

    var onSuccess: (() -> Void)?

    private let accountRepository: AccountRepositoryProtocol
    private let account: Account

    init(accountRepository: AccountRepositoryProtocol, account: Account) {
        self.accountRepository = accountRepository
        self.account = account
    }

    func deposit() async {
        guard let value = Decimal(string: amount), value > 0 else {
            errorMessage = "Введите корректную сумму"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await accountRepository.deposit(accountId: account.id, amount: value)
            onSuccess?()
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
