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
    let dailyPayment: Decimal?
    let status: String?

    init(
        id: String,
        clientId: String,
        accountId: String,
        tariffId: String,
        amount: Decimal,
        remainingAmount: Decimal,
        issuedAt: Date,
        tariffName: String?,
        rate: Decimal?,
        dailyPayment: Decimal? = nil,
        status: String?)
    {
        self.id = id
        self.clientId = clientId
        self.accountId = accountId
        self.tariffId = tariffId
        self.amount = amount
        self.remainingAmount = remainingAmount
        self.issuedAt = issuedAt
        self.tariffName = tariffName
        self.rate = rate
        self.dailyPayment = dailyPayment
        self.status = status
    }

    var statusDisplayTitle: String {
        switch (status ?? "").lowercased() {
            case "active": return "Активен"
            case "paid": return "Погашен"
            case "overdue": return "Просрочен"
            case "": return "—"
            default: return status ?? "—"
        }
    }

    var displayAnnualRatePercent: Decimal? {
        guard let r = rate, r > 0 else { return nil }
        return r < 1 ? r * 100 : r
    }

    var dailyPaymentRounded: Decimal? {
        guard let d = dailyPayment, d > 0 else { return nil }
        return d.roundedToScale(0)
    }
}

struct CreditTariff: Identifiable, Hashable {
    let id: String
    let name: String
    let rate: Decimal
    let minAmount: Decimal?
    let maxAmount: Decimal?

    var displayAnnualPercent: Decimal {
        rate < 1 ? rate * 100 : rate
    }
}

struct CreditScheduledPayment: Identifiable, Hashable {
    var id: Int { index }
    let day: Int?
    let index: Int
    let dueAt: Date
    let amountDue: Decimal?
    let amountPaid: Decimal?
    let amountRemaining: Decimal?
    let expectedTotal: Decimal
    let paidNowTotal: Decimal
    let status: String

    var paymentStatusDisplayTitle: String {
        switch status.lowercased() {
            case "paid": return "Внесено"
            case "overdue": return "Просрочено"
            case "partial": return "Частично"
            case "pending": return "Ожидает"
            default: return status
        }
    }

    var outstanding: Decimal {
        max(0, expectedTotal - paidNowTotal)
    }

    var titleLine: String {
        if let day {
            return "День \(day)"
        }
        return "Платёж \(index)"
    }

    init(
        day: Int? = nil,
        index: Int,
        dueAt: Date,
        amountDue: Decimal? = nil,
        amountPaid: Decimal? = nil,
        amountRemaining: Decimal? = nil,
        expectedTotal: Decimal,
        paidNowTotal: Decimal,
        status: String)
    {
        self.day = day
        self.index = index
        self.dueAt = dueAt
        self.amountDue = amountDue
        self.amountPaid = amountPaid
        self.amountRemaining = amountRemaining
        self.expectedTotal = expectedTotal
        self.paidNowTotal = paidNowTotal
        self.status = status
    }
}
