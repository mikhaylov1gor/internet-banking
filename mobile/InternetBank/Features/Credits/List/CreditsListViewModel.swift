import Foundation

@Observable
final class CreditsListViewModel {
    var credits: [Credit] = []
    var isLoading = false
    var errorMessage: String?

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
}
