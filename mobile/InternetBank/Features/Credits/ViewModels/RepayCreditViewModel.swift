import Foundation

@Observable
final class RepayCreditViewModel {
    var amount: String = ""
    var isLoading: Bool = false
    var errorMessage: String?

    var onSuccess: (() -> Void)?

    private let creditRepository: CreditRepositoryProtocol
    private let credit: Credit

    init(creditRepository: CreditRepositoryProtocol, credit: Credit) {
        self.creditRepository = creditRepository
        self.credit = credit
    }

    func repay() async {
        guard let value = Decimal(string: amount), value > 0 else {
            errorMessage = "Введите корректную сумму"
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            try await creditRepository.repayCredit(creditId: credit.id, amount: value)
            onSuccess?()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
