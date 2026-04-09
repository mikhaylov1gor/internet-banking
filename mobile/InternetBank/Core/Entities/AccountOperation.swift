import Foundation

struct AccountOperation: Identifiable, Hashable {
    private static let transferDescription = "перевод между счетами"

    let id: String
    let accountId: String
    let type: OperationType
    let amount: Decimal
    let date: Date
    let balanceAfter: Decimal?
    let description: String?

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

    var displayTitle: String {
        if description == Self.transferDescription {
            switch type {
                case .withdraw: return "Перевод со счёта"
                case .deposit: return "Перевод на счёт"
                default: break
            }
        }
        return type.displayName
    }
}
