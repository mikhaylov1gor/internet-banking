import Foundation

enum CreditEndpoints {
    static func credits(clientId: String, page: Int = 1, pageSize: Int = 50) -> String {
        "/credits?client_id=\(clientId)&page=\(page)&page_size=\(pageSize)"
    }
    static func credit(id: String) -> String { "/credits/\(id)" }
    static func tariffs(page: Int = 1, pageSize: Int = 50) -> String {
        "/tariffs?page=\(page)&page_size=\(pageSize)"
    }
    static let takeCredit = "/credits"
    static func repayCredit(creditId: String) -> String { "/credits/\(creditId)/repay" }
}
