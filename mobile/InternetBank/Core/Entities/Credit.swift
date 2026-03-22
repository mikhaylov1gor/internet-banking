import Foundation

struct Credit: Identifiable, Hashable {
    let id: String
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: Decimal
    var remainingAmount: Decimal
    let issuedAt: Date
    let tariffName: String?
    let rate: Decimal?
    let status: String?

    var statusDisplayTitle: String {
        switch (status ?? "").lowercased() {
            case "active": return "Активен"
            case "paid": return "Погашен"
            case "overdue": return "Просрочен"
            case "": return "—"
            default: return status ?? "—"
        }
    }
}

struct CreditTariff: Identifiable, Hashable {
    let id: String
    let name: String
    let rate: Decimal
    let minAmount: Decimal?
    let maxAmount: Decimal?
}
