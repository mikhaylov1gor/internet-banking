import Foundation

enum AccountEndpoints {
    static func accounts(clientId: String? = nil, page: Int = 1, pageSize: Int = 50) -> String {
        var params: [String] = []
        if let id = clientId { params.append("client_id=\(id)") }
        params.append("page=\(page)")
        params.append("page_size=\(pageSize)")
        return "/accounts?" + params.joined(separator: "&")
    }

    static func account(id: String) -> String { "/accounts/\(id)" }
    static let openAccount = "/accounts"
    static let transfer = "/accounts/transfer"
    static let transferPreview = "/accounts/transfer/preview"
    static func closeAccount(id: String, clientId: String) -> String { "/accounts/\(id)?client_id=\(clientId)" }
    static func deposit(accountId: String) -> String { "/accounts/\(accountId)/deposit" }
    static func withdraw(accountId: String) -> String { "/accounts/\(accountId)/withdraw" }
    static func operations(accountId: String, page: Int = 1, pageSize: Int = 50) -> String {
        "/accounts/\(accountId)/operations?page=\(page)&page_size=\(pageSize)"
    }
}
