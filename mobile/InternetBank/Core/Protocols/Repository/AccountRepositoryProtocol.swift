import Foundation

protocol AccountRepositoryProtocol: AnyObject {
    func getAccounts(clientId: String) async throws -> [Account]
    func getAccount(id: String) async throws -> Account?
    func openAccount(clientId: String, currency: String) async throws -> Account
    func closeAccount(id: String, clientId: String) async throws
    func deposit(accountId: String, amount: Decimal) async throws
    func withdraw(accountId: String, amount: Decimal) async throws
    func transfer(fromAccountId: String, toAccountId: String, amount: Decimal) async throws
    func getOperations(accountId: String) async throws -> [AccountOperation]
}
