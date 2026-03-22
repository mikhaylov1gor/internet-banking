import Foundation

@Observable
final class CreditDetailViewModel {
    var credit: Credit
    var rating: CreditRatingDTO?
    var overdue: CreditOverdueDTO?
    var isLoadingRating = false
    var isLoadingOverdue = false
    var errorMessage: String?

    private let creditRepository: CreditRepositoryProtocol
    private let clientId: String

    init(creditRepository: CreditRepositoryProtocol, credit: Credit, clientId: String) {
        self.creditRepository = creditRepository
        self.credit = credit
        self.clientId = clientId
    }

    func loadRating() async {
        isLoadingRating = true
        errorMessage = nil
        defer { isLoadingRating = false }
        do {
            rating = try await creditRepository.getClientCreditRating(clientId: clientId)
        } catch {
            errorMessage = error.displayMessage
        }
    }

    func loadOverdue() async {
        isLoadingOverdue = true
        errorMessage = nil
        defer { isLoadingOverdue = false }
        do {
            overdue = try await creditRepository.getCreditOverdue(creditId: credit.id)
        } catch {
            errorMessage = error.displayMessage
        }
    }

    func refreshCredit() async {
        do {
            if let updated = try await creditRepository.getCredit(id: credit.id) {
                credit = updated
            }
        } catch {
            errorMessage = error.displayMessage
        }
    }
}
