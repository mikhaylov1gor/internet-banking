import Foundation

final class CreditRepository: CreditRepositoryProtocol {
    private let creditsAPI: APIClient

    init(creditsAPI: APIClient) {
        self.creditsAPI = creditsAPI
    }

    func getCredits(clientId: String) async throws -> [Credit] {
        let response: CreditsListResponse = try await creditsAPI.request(
            path: CreditEndpoints.credits(clientId: clientId)
        )
        return response.credits.map { mapToCredit($0) }
    }

    func getCredit(id: String) async throws -> Credit? {
        let response: CreditResponse = try await creditsAPI.request(
            path: CreditEndpoints.credit(id: id)
        )
        return mapToCredit(response)
    }

    func getTariffs() async throws -> [CreditTariff] {
        let response: TariffsListResponse = try await creditsAPI.request(
            path: CreditEndpoints.tariffs()
        )
        return response.tariffs.map { mapToTariff($0) }
    }

    func takeCredit(clientId: String, accountId: String, tariffId: String, amount: Decimal) async throws -> Credit {
        let request = TakeCreditRequest(
            clientId: clientId,
            accountId: accountId,
            tariffId: tariffId,
            amount: amount
        )
        let response: CreditResponse = try await creditsAPI.request(
            path: CreditEndpoints.takeCredit(),
            method: "POST",
            body: request
        )
        return mapToCredit(response)
    }

    func repayCredit(creditId: String, amount: Decimal) async throws {
        let _: EmptyResponse = try await creditsAPI.request(
            path: CreditEndpoints.repayCredit(creditId: creditId),
            method: "POST",
            body: RepayRequest(amount: amount)
        )
    }

    private func mapToCredit(_ dto: CreditResponse) -> Credit {
        Credit(
            id: dto.id,
            clientId: dto.clientId,
            accountId: dto.accountId,
            tariffId: dto.tariffId,
            amount: Decimal(string: dto.amount) ?? 0,
            remainingAmount: Decimal(string: dto.remainingAmount) ?? 0,
            startDate: ISO8601DateFormatter().date(from: dto.startDate) ?? Date(),
            tariffName: dto.tariffName,
            tariffRate: Decimal(string: dto.tariffRate) ?? 0
        )
    }

    private func mapToTariff(_ dto: TariffResponse) -> CreditTariff {
        CreditTariff(
            id: dto.id,
            name: dto.name,
            rate: Decimal(string: dto.rate) ?? 0
        )
    }
}
