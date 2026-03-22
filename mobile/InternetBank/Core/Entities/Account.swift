import Foundation

struct Account: Identifiable, Hashable {
    let id: String
    let clientId: String
    var balance: Decimal
    let currency: String
    let openedAt: Date
    let status: String
    let accountNumber: String

    init(
        id: String,
        clientId: String,
        balance: Decimal,
        currency: String,
        openedAt: Date,
        status: String,
        accountNumber: String = "")
    {
        self.id = id
        self.clientId = clientId
        self.balance = balance
        self.currency = currency
        self.openedAt = openedAt
        self.status = status
        self.accountNumber = accountNumber
    }

    var displayAccountNumber: String {
        accountNumber.isEmpty ? "···\(String(id.suffix(8)))" : accountNumber
    }

    var clipboardAccountReference: String {
        accountNumber.isEmpty ? id : accountNumber
    }

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
