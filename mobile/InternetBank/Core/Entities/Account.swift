import Foundation

struct Account: Identifiable, Hashable {
    let id: String
    let clientId: String
    var balance: Decimal
    let openedAt: Date
    let status: String
}
