import Foundation

struct Account: Identifiable, Hashable {
    let id: String
    let clientId: String
    var balance: Decimal
    let currency: String
    let openedAt: Date
    let status: String

    var currencySymbol: String {
        switch currency.uppercased() {
            case "USD": return "$"
            case "EUR": return "€"
            default: return "₽"
        }
    }

    var statusDisplayTitle: String {
        switch status.lowercased() {
            case "active": return "Активен"
            case "closed": return "Закрыт"
            default: return status
        }
    }
}
