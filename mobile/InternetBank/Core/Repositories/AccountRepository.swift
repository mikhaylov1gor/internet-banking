import Foundation

final class AccountRepository: AccountRepositoryProtocol {
    private let coreAPI: APIClient

    init(coreAPI: APIClient) {
        self.coreAPI = coreAPI
    }

    func getAccounts(clientId: String) async throws -> [Account] {
        let response: AccountsListResponse = try await coreAPI.request(
            path: AccountEndpoints.accounts(clientId: clientId)
        )
        return response.accounts.map { mapToAccount($0) }
    }

    func getAccount(id: String) async throws -> Account? {
        let response: AccountResponse = try await coreAPI.request(
            path: AccountEndpoints.account(id: id)
        )
        return mapToAccount(response)
    }

    func openAccount(clientId: String) async throws -> Account {
        let response: AccountResponse = try await coreAPI.request(
            path: AccountEndpoints.openAccount(clientId: clientId),
            method: "POST"
        )
        return mapToAccount(response)
    }

    func closeAccount(id: String) async throws {
        let _: EmptyResponse = try await coreAPI.request(
            path: AccountEndpoints.closeAccount(id: id),
            method: "POST"
        )
    }

    func deposit(accountId: String, amount: Decimal) async throws {
        let _: EmptyResponse = try await coreAPI.request(
            path: AccountEndpoints.deposit(accountId: accountId),
            method: "POST",
            body: DepositRequest(amount: amount)
        )
    }

    func withdraw(accountId: String, amount: Decimal) async throws {
        let _: EmptyResponse = try await coreAPI.request(
            path: AccountEndpoints.withdraw(accountId: accountId),
            method: "POST",
            body: DepositRequest(amount: amount)
        )
    }

    func getOperations(accountId: String) async throws -> [AccountOperation] {
        let response: OperationsListResponse = try await coreAPI.request(
            path: AccountEndpoints.operations(accountId: accountId)
        )
        return response.operations.compactMap { mapToOperation($0) }
    }

    private func mapToAccount(_ dto: AccountResponse) -> Account {
        Account(
            id: dto.id,
            clientId: dto.clientId,
            balance: Decimal(string: dto.balance) ?? 0,
            createdAt: ISO8601DateFormatter().date(from: dto.createdAt) ?? Date()
        )
    }

    private func mapToOperation(_ dto: OperationResponse) -> AccountOperation? {
        guard let type = AccountOperation.OperationType(rawValue: dto.type) else { return nil }
        return AccountOperation(
            id: dto.id,
            accountId: dto.accountId,
            type: type,
            amount: Decimal(string: dto.amount) ?? 0,
            date: ISO8601DateFormatter().date(from: dto.date) ?? Date()
        )
    }
}
