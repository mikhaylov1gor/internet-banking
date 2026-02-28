import Foundation

enum AccountEndpoints {
    static func accounts(clientId: String) -> String { "/clients/\(clientId)/accounts" }
    static func account(id: String) -> String { "/accounts/\(id)" }
    static func openAccount(clientId: String) -> String { "/clients/\(clientId)/accounts" }
    static func closeAccount(id: String) -> String { "/accounts/\(id)/close" }
    static func deposit(accountId: String) -> String { "/accounts/\(accountId)/deposit" }
    static func withdraw(accountId: String) -> String { "/accounts/\(accountId)/withdraw" }
    static func operations(accountId: String) -> String { "/accounts/\(accountId)/operations" }
}
