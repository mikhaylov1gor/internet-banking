import Foundation

final class AccountRepository: AccountRepositoryProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getAccounts(clientId: String) async throws -> [Account] {
        let response: AccountListResponse = try await apiClient.request(
            path: AccountEndpoints.accounts(clientId: clientId))
        return response.accounts.map { mapToAccount($0) }
    }

    func getAccount(id: String) async throws -> Account? {
        let response: AccountResponse = try await apiClient.request(
            path: AccountEndpoints.account(id: id))
        return mapToAccount(response)
    }

    func openAccount(clientId: String, currency: String) async throws -> Account {
        let request = OpenAccountRequest(clientId: clientId, currency: currency)
        let response: AccountResponse = try await apiClient.request(
            path: AccountEndpoints.openAccount,
            method: "POST",
            body: request)
        return mapToAccount(response)
    }

    func closeAccount(id: String, clientId: String) async throws {
        try await apiClient.requestEmpty(
            path: AccountEndpoints.closeAccount(id: id, clientId: clientId),
            method: "DELETE")
    }

    func deposit(accountId: String, amount: Decimal) async throws {
        let request = ChangeBalanceRequest(amount: NSDecimalNumber(decimal: amount).doubleValue)
        let _: OperationResponse = try await apiClient.request(
            path: AccountEndpoints.deposit(accountId: accountId),
            method: "POST",
            body: request)
    }

    func withdraw(accountId: String, amount: Decimal) async throws {
        let request = ChangeBalanceRequest(amount: NSDecimalNumber(decimal: amount).doubleValue)
        let _: OperationResponse = try await apiClient.request(
            path: AccountEndpoints.withdraw(accountId: accountId),
            method: "POST",
            body: request)
    }

    func transfer(fromAccountId: String, to destination: AccountTransferDestination, amount: Decimal) async throws {
        let value = NSDecimalNumber(decimal: amount).doubleValue
        let request: TransferRequest
        switch destination {
            case let .accountId(id):
                request = TransferRequest(
                    fromAccountId: fromAccountId,
                    amount: value,
                    toAccountId: id,
                    toAccountNumber: nil)
            case let .accountNumber(number):
                request = TransferRequest(
                    fromAccountId: fromAccountId,
                    amount: value,
                    toAccountId: nil,
                    toAccountNumber: number)
        }
        let _: TransferAPIResponse = try await apiClient.request(
            path: AccountEndpoints.transfer,
            method: "POST",
            body: request)
    }

    func getOperations(accountId: String) async throws -> [AccountOperation] {
        let response: OperationListResponse = try await apiClient.request(
            path: AccountEndpoints.operations(accountId: accountId))
        return response.operations.compactMap { AccountOperationMapping.from(dto: $0) }
    }

    private func mapToAccount(_ dto: AccountResponse) -> Account {
        let number = dto.accountNumber?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return Account(
            id: dto.id,
            clientId: dto.clientId,
            balance: Decimal(dto.balance),
            currency: dto.currency ?? "RUB",
            openedAt: ISO8601DateFormatter().date(from: dto.openedAt) ?? Date(),
            status: dto.status,
            accountNumber: number)
    }

}
