import Foundation

final class CreditRepository: CreditRepositoryProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getCredits(clientId: String) async throws -> [Credit] {
        let response: CreditListResponse = try await apiClient.request(
            path: CreditEndpoints.credits(clientId: clientId))
        return response.credits.map { mapToCredit($0) }
    }

    func getCredit(id: String) async throws -> Credit? {
        let response: CreditResponse = try await apiClient.request(
            path: CreditEndpoints.credit(id: id))
        return mapToCredit(response)
    }

    func getTariffs() async throws -> [CreditTariff] {
        let response: TariffListResponse = try await apiClient.request(
            path: CreditEndpoints.tariffs())
        return response.tariffs.map { mapToTariff($0) }
    }

    func takeCredit(clientId: String, accountId: String, tariffId: String, amount: Decimal) async throws -> Credit {
        let value = NSDecimalNumber(decimal: amount).doubleValue
        let request = IssueCreditRequest(
            clientId: clientId,
            accountId: accountId,
            tariffId: tariffId,
            amount: value)
        let response: CreditResponse = try await apiClient.request(
            path: CreditEndpoints.takeCredit,
            method: "POST",
            body: request)
        return mapToCredit(response)
    }

    func repayCredit(creditId: String, accountId: String, amount: Decimal) async throws {
        let request = RepayCreditRequest(
            amount: NSDecimalNumber(decimal: amount).doubleValue,
            accountId: accountId)
        let _: CreditResponse = try await apiClient.request(
            path: CreditEndpoints.repayCredit(creditId: creditId),
            method: "POST",
            body: request)
    }

    func getCreditOverdue(creditId: String) async throws -> CreditOverdueDTO {
        try await apiClient.request(path: CreditEndpoints.creditOverdue(creditId: creditId))
    }

    func getClientCreditRating(clientId: String) async throws -> CreditRatingDTO {
        try await apiClient.request(path: CreditEndpoints.clientCreditRating(clientId: clientId))
    }

    private func mapToCredit(_ dto: CreditResponse) -> Credit {
        Credit(
            id: dto.id,
            clientId: dto.clientId,
            accountId: dto.accountId,
            tariffId: dto.tariffId,
            amount: Decimal(dto.amount),
            remainingAmount: Decimal(dto.remaining ?? dto.amount),
            issuedAt: (dto.issuedAt.flatMap { ISO8601DateFormatter().date(from: $0) }) ?? Date(),
            tariffName: nil,
            rate: dto.rate.map { Decimal($0) },
            status: dto.status)
    }

    private func mapToTariff(_ dto: TariffResponse) -> CreditTariff {
        CreditTariff(
            id: dto.id,
            name: dto.name,
            rate: Decimal(dto.rate),
            minAmount: dto.minAmount.map { Decimal($0) },
            maxAmount: dto.maxAmount.map { Decimal($0) })
    }
}
