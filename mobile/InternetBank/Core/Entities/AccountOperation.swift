import Foundation

struct AccountOperation: Identifiable, Hashable {
    let id: String
    let accountId: String
    let type: OperationType
    let amount: Decimal
    let date: Date

    enum OperationType: String, Hashable, Codable {
        case deposit
        case withdraw
        case creditRepay = "credit_repay"
        case creditIssue = "credit_issue"

        var displayName: String {
            switch self {
                case .deposit: return "Пополнение"
                case .withdraw: return "Снятие"
                case .creditRepay: return "Погашение кредита"
                case .creditIssue: return "Выдача кредита"
            }
        }
    }
}
