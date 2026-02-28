import Foundation

enum CreditEndpoints {
    static func credits(clientId: String) -> String { "/clients/\(clientId)/credits" }
    static func credit(id: String) -> String { "/credits/\(id)" }
    static func tariffs() -> String { "/credits/tariffs" }
    static func takeCredit() -> String { "/credits" }
    static func repayCredit(creditId: String) -> String { "/credits/\(creditId)/repay" }
}
