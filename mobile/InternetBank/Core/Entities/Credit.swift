import Foundation

struct Credit: Identifiable, Hashable {
    let id: String
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: Decimal
    var remainingAmount: Decimal
    let startDate: Date
    let tariffName: String
    let tariffRate: Decimal
}

struct CreditTariff: Identifiable, Hashable {
    let id: String
    let name: String
    let rate: Decimal
}
