import Foundation

@Observable
@MainActor
final class CreditDetailViewModel {
    var credit: Credit
    var linkedAccountNumber: String = ""
    var payments: [CreditScheduledPayment] = []
    var onlyOverduePayments = false
    var errorMessage: String?

    private let creditRepository: CreditRepositoryProtocol
    private let accountRepository: AccountRepositoryProtocol

    var linkedAccountDisplayValue: String {
        let d = ClientBankFormat.digitsOnlyAccountNumber(linkedAccountNumber)
        if !d.isEmpty {
            return ClientBankFormat.formatAccountNumberMasked(d)
        }
        return "#\(ClientBankFormat.formatShortId(credit.accountId))"
    }

    var linkedAccountCopyValue: String {
        let d = ClientBankFormat.digitsOnlyAccountNumber(linkedAccountNumber)
        if !d.isEmpty { return d }
        return credit.accountId
    }

    var displayedPayments: [CreditScheduledPayment] {
        let sorted = payments.sorted { $0.index < $1.index }
        guard onlyOverduePayments else { return sorted }
        return sorted.filter { $0.status.lowercased() == "overdue" }
    }

    init(
        creditRepository: CreditRepositoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        credit: Credit)
    {
        self.creditRepository = creditRepository
        self.accountRepository = accountRepository
        self.credit = credit
    }

    func refreshCredit() async {
        errorMessage = nil
        do {
            if let updated = try await creditRepository.getCredit(id: credit.id) {
                credit = updated
            }
            if let acc = try await accountRepository.getAccount(id: credit.accountId) {
                linkedAccountNumber = acc.accountNumber
            } else {
                linkedAccountNumber = ""
            }
        } catch is CancellationError {
        } catch {
            errorMessage = error.displayMessage
        }
        do {
            let list = try await creditRepository.getCreditPayments(
                creditId: credit.id,
                page: 1,
                pageSize: 100,
                onlyOverdue: false)
            payments = list.items.sorted { $0.index < $1.index }
        } catch is CancellationError {
        } catch {
            payments = []
            if errorMessage == nil {
                errorMessage = error.displayMessage
            }
        }
    }

    func suggestedRepayAmount(for payment: CreditScheduledPayment) -> Decimal {
        if payment.status.lowercased() == "paid" { return 0 }
        let cap = credit.remainingAmount
        if let ar = payment.amountRemaining, ar >= 0 {
            let v = ar.roundedToScale(2)
            if v >= 0.01 { return min(v, cap) }
        }
        guard let daily = credit.dailyPayment, daily > 0 else {
            let raw = payment.outstanding.roundedToScale(2)
            guard raw >= 0.01 else { return 0 }
            return min(raw, cap)
        }
        let cent = Decimal(1) / Decimal(100)
        let minutePayment = max(daily / Decimal(1440), cent)
        let expectedPrev: Decimal
        if payment.index <= 1 {
            expectedPrev = 0
        } else {
            let scaled = minutePayment * Decimal(payment.index - 1)
            expectedPrev = min(credit.amount, scaled).roundedToScale(2)
        }
        let paid = payment.paidNowTotal
        let installmentDue = (payment.expectedTotal - max(paid, expectedPrev)).roundedToScale(2)
        let due = max(0, installmentDue)
        guard due >= 0.01 else { return 0 }
        return min(due, cap)
    }

    func canRepayPaymentRow(_ payment: CreditScheduledPayment) -> Bool {
        payment.status.lowercased() != "paid" && suggestedRepayAmount(for: payment) >= 0.01
    }
}
