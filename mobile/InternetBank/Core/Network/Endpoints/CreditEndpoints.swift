import Foundation

enum CreditEndpoints {
    static func credits(clientId: String) -> String { "/credits?client_id=\(clientId)" }
    static func credit(id: String) -> String { "/credits/\(id)" }
    static let tariffs = "/tariffs"
    static let takeCredit = "/credits"
    static func repayCredit(creditId: String) -> String { "/credits/\(creditId)/repay" }
}
