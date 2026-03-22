import Foundation

protocol CreditRepositoryProtocol: AnyObject {
    func getCredits(clientId: String) async throws -> [Credit]
    func getCredit(id: String) async throws -> Credit?
    func getTariffs() async throws -> [CreditTariff]
    func takeCredit(clientId: String, accountId: String, tariffId: String, amount: Decimal) async throws -> Credit
    func repayCredit(creditId: String, accountId: String, amount: Decimal) async throws
    func getCreditOverdue(creditId: String) async throws -> CreditOverdueDTO
    func getClientCreditRating(clientId: String) async throws -> CreditRatingDTO
}
