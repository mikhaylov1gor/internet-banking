import Foundation

@Observable
@MainActor
final class CreditDetailViewModel {
    var credit: Credit
    var linkedAccountNumber: String = ""
    var errorMessage: String?

    private let creditRepository: CreditRepositoryProtocol
    private let accountRepository: AccountRepositoryProtocol

    var linkedAccountDisplayValue: String {
        linkedAccountNumber.isEmpty
            ? "···\(String(credit.accountId.prefix(8)))…"
            : linkedAccountNumber
    }

    var linkedAccountCopyValue: String {
        linkedAccountNumber.isEmpty ? credit.accountId : linkedAccountNumber
    }

    init(
        creditRepository: CreditRepositoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        credit: Credit)
    {
        self.creditRepository = creditRepository
        self.accountRepository = accountRepository
        self.credit = credit
    }

    func refreshCredit() async {
        do {
            if let updated = try await creditRepository.getCredit(id: credit.id) {
                credit = updated
            }
            if let acc = try await accountRepository.getAccount(id: credit.accountId) {
                linkedAccountNumber = acc.accountNumber
            } else {
                linkedAccountNumber = ""
            }
            errorMessage = nil
        } catch {
            errorMessage = error.displayMessage
        }
    }
}
