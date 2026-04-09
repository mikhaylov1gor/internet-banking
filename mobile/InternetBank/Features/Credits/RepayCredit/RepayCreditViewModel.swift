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
    private let suggestedAmount: Decimal?

    init(
        creditRepository: CreditRepositoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        credit: Credit,
        suggestedAmount: Decimal?)
    {
        self.creditRepository = creditRepository
        self.accountRepository = accountRepository
        self.credit = credit
        self.suggestedAmount = suggestedAmount
    }

    func loadData() async {
        isLoading = true
        do {
            accounts = try await accountRepository.getAccounts(clientId: credit.clientId)
            selectedAccountId = accounts.first { $0.id == credit.accountId }?.id ?? accounts.first?.id ?? ""
            if let s = suggestedAmount, s >= 0.01 {
                let capped = min(s, credit.remainingAmount)
                amount = NSDecimalNumber(decimal: capped).stringValue
            }
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func repay() async {
        let normalized = amount.replacingOccurrences(of: ",", with: ".")
        guard let value = Decimal(string: normalized), value > 0 else {
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
