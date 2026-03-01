import Foundation

@Observable
final class TakeCreditViewModel {
    var tariffs: [CreditTariff] = []
    var selectedTariffId = ""
    var selectedAccountId = ""
    var amount = ""
    var accounts: [Account] = []
    var isLoading = false
    var errorMessage: String?

    var onSuccess: ((Credit) -> Void)?

    private let creditRepository: CreditRepositoryProtocol
    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String

    init(
        creditRepository: CreditRepositoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        clientId: String)
    {
        self.creditRepository = creditRepository
        self.accountRepository = accountRepository
        self.clientId = clientId
    }

    func loadData() async {
        isLoading = true
        do {
            async let tariffsTask = creditRepository.getTariffs()
            async let accountsTask = accountRepository.getAccounts(clientId: clientId)
            tariffs = try await tariffsTask
            accounts = try await accountsTask
            selectedTariffId = tariffs.first?.id ?? ""
            selectedAccountId = accounts.first?.id ?? ""
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func takeCredit() async {
        guard let value = Decimal(string: amount), value > 0 else {
            errorMessage = "Введите корректную сумму"
            return
        }
        guard !selectedTariffId.isEmpty, !selectedAccountId.isEmpty else {
            errorMessage = "Выберите тариф и счёт"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            let credit = try await creditRepository.takeCredit(
                clientId: clientId,
                accountId: selectedAccountId,
                tariffId: selectedTariffId,
                amount: value)
            onSuccess?(credit)
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
