import Foundation

@Observable
final class CreditsListViewModel {
    var credits: [Credit] = []
    var isLoading = false
    var errorMessage: String?

    var creditRating: CreditRatingDTO?
    var isLoadingRating = false
    var ratingError: String?

    private let creditRepository: CreditRepositoryProtocol
    private let clientId: String

    init(creditRepository: CreditRepositoryProtocol, clientId: String) {
        self.creditRepository = creditRepository
        self.clientId = clientId
    }

    func loadCredits() async {
        isLoading = true
        do {
            credits = try await creditRepository.getCredits(clientId: clientId)
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func loadCreditRating() async {
        isLoadingRating = true
        ratingError = nil
        defer { isLoadingRating = false }
        do {
            creditRating = try await creditRepository.getClientCreditRating(clientId: clientId)
        } catch {
            ratingError = error.displayMessage
            creditRating = nil
        }
    }
}
