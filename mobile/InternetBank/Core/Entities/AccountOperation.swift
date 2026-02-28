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
        case creditPayment
        case creditReceipt
    }
}
