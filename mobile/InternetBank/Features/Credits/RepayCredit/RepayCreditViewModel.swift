import Foundation

@Observable
final class RepayCreditViewModel {
    var accounts: [Account] = []
    var selectedAccountId = ""
    var amount = ""
    var isLoading = false
    var errorMessage: String?

    var onSuccess: (() -> Void)?

    private let creditRepository: CreditRepositoryProtocol
    private let accountRepository: AccountRepositoryProtocol
    private let credit: Credit

    init(
        creditRepository: CreditRepositoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        credit: Credit)
    {
        self.creditRepository = creditRepository
        self.accountRepository = accountRepository
        self.credit = credit
    }

    func loadData() async {
        isLoading = true
        do {
            accounts = try await accountRepository.getAccounts(clientId: credit.clientId)
            selectedAccountId = accounts.first { $0.id == credit.accountId }?.id ?? accounts.first?.id ?? ""
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func repay() async {
        guard let value = Decimal(string: amount), value > 0 else {
            errorMessage = "Введите корректную сумму"
            return
        }
        guard value <= credit.remainingAmount else {
            errorMessage = "Сумма не может превышать остаток по кредиту (\(credit.remainingAmount.formattedAmount) ₽)"
            return
        }
        guard !selectedAccountId.isEmpty else {
            errorMessage = "Выберите счёт для списания"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await creditRepository.repayCredit(creditId: credit.id, accountId: selectedAccountId, amount: value)
            onSuccess?()
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
