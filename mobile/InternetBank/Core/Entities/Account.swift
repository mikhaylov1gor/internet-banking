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
        let d = ClientBankFormat.digitsOnlyAccountNumber(accountNumber)
        if !d.isEmpty {
            return ClientBankFormat.formatAccountNumberMasked(d)
        }
        if accountNumber.isEmpty {
            return "···\(ClientBankFormat.formatShortId(id, visibleLength: 8))"
        }
        return accountNumber
    }

    var clipboardAccountReference: String {
        let d = ClientBankFormat.digitsOnlyAccountNumber(accountNumber)
        if !d.isEmpty { return d }
        return id
    }

    static func symbol(forCurrencyCode code: String) -> String {
        switch code.uppercased() {
            case "USD": return "$"
            case "EUR": return "€"
            default: return "₽"
        }
    }

    var currencySymbol: String {
        Self.symbol(forCurrencyCode: currency)
    }

    var statusDisplayTitle: String {
        switch status.lowercased() {
            case "active": return "Активен"
            case "closed": return "Закрыт"
            default: return status
        }
    }
}
