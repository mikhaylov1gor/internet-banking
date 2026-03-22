import Foundation

@Observable
@MainActor
final class CreditDetailViewModel {
    var credit: Credit
    var errorMessage: String?

    private let creditRepository: CreditRepositoryProtocol

    init(creditRepository: CreditRepositoryProtocol, credit: Credit) {
        self.creditRepository = creditRepository
        self.credit = credit
    }

    func refreshCredit() async {
        do {
            if let updated = try await creditRepository.getCredit(id: credit.id) {
                credit = updated
            }
            errorMessage = nil
        } catch {
            errorMessage = error.displayMessage
        }
    }
}
