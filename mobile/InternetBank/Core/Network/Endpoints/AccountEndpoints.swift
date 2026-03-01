import Foundation

enum AccountEndpoints {
    static func accounts(clientId: String? = nil) -> String {
        guard let id = clientId else { return "/accounts" }
        return "/accounts?client_id=\(id)"
    }

    static func account(id: String) -> String { "/accounts/\(id)" }
    static let openAccount = "/accounts"
    static func closeAccount(id: String, clientId: String) -> String { "/accounts/\(id)?client_id=\(clientId)" }
    static func deposit(accountId: String) -> String { "/accounts/\(accountId)/deposit" }
    static func withdraw(accountId: String) -> String { "/accounts/\(accountId)/withdraw" }
    static func operations(accountId: String) -> String { "/accounts/\(accountId)/operations" }
}
