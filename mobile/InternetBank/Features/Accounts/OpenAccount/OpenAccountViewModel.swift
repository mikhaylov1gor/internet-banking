import Foundation

@Observable
final class OpenAccountViewModel {
    var isLoading = false
    var errorMessage: String?
    var selectedCurrencyCode = "RUB"

    var onSuccess: ((Account) -> Void)?

    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String

    static let currencyCodes = ["RUB", "USD", "EUR"]

    init(accountRepository: AccountRepositoryProtocol, clientId: String) {
        self.accountRepository = accountRepository
        self.clientId = clientId
    }

    func openAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            let account = try await accountRepository.openAccount(
                clientId: clientId,
                currency: selectedCurrencyCode)
            onSuccess?(account)
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }
}
