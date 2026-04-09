import SwiftUI
import UIKit

struct CreditDetailView: View {
    @Bindable var viewModel: CreditDetailViewModel
    var creditsRefreshTrigger: Int
    var onRepay: (Decimal?) -> Void
    var onOpenLinkedAccount: (String) -> Void

    private var creditStatusKey: String {
        (viewModel.credit.status ?? "").lowercased()
    }

    private var canOperateCredit: Bool {
        creditStatusKey == "active" || creditStatusKey == "overdue"
    }

    private var showsRemainingBlock: Bool {
        canOperateCredit
    }

    private static var paymentDueFormat: Date.FormatStyle {
        Date.FormatStyle()
            .locale(Locale(identifier: "ru_RU"))
            .day()
            .month(.wide)
            .year()
            .hour()
            .minute()
    }

    var body: some View {
        List {
            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(ClientBankTheme.statusOverdue)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Section {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("Кредит")
                        .font(.headline)
                        .foregroundStyle(ClientBankTheme.primaryStart)
                    Button {
                        UIPasteboard.general.string = viewModel.credit.id
                    } label: {
                        Text("#\(String(viewModel.credit.id.prefix(8)))…")
                            .font(.headline)
                            .foregroundStyle(ClientBankTheme.textAccent)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Скопировать полный номер кредита")
                    Spacer(minLength: 0)
                }
            }
            Section {
                LabeledContent("Сумма") {
                    Text("\(viewModel.credit.amount.formattedAmount) ₽")
                        .multilineTextAlignment(.trailing)
                        .foregroundStyle(ClientBankTheme.creditAmount)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                if showsRemainingBlock {
                    LabeledContent("Остаток") {
                        Text("\(viewModel.credit.remainingAmount.formattedAmount) ₽")
                            .multilineTextAlignment(.trailing)
                            .foregroundStyle(ClientBankTheme.creditRemaining)
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }
                if let pct = viewModel.credit.displayAnnualRatePercent {
                    LabeledContent("Процентная ставка") {
                        Text("\(pct.formattedAmount)%")
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }
                LabeledContent("Статус") {
                    Text(viewModel.credit.statusDisplayTitle)
                        .multilineTextAlignment(.trailing)
                        .foregroundStyle(creditStatusColor(creditStatusKey))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                LabeledContent("Выдан") {
                    Text(viewModel.credit.issuedAt.formatted(date: .numeric, time: .omitted))
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                LabeledContent("Счёт") {
                    HStack(spacing: 12) {
                        Button {
                            UIPasteboard.general.string = viewModel.linkedAccountCopyValue
                        } label: {
                            Text(viewModel.linkedAccountDisplayValue)
                                .font(.body)
                                .foregroundStyle(ClientBankTheme.link)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("Скопировать номер счёта")
                        Button("Открыть") {
                            onOpenLinkedAccount(viewModel.credit.accountId)
                        }
                    }
                }
            }
            if canOperateCredit {
                Section {
                    Button("Погасить кредит") {
                        onRepay(nil)
                    }
                }
            }
            if canOperateCredit {
                Section {
                    Toggle("Только просроченные", isOn: $viewModel.onlyOverduePayments)
                    if viewModel.displayedPayments.isEmpty {
                        Text("Нет платежей для отображения.")
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        ForEach(viewModel.displayedPayments) { payment in
                            paymentRow(payment)
                        }
                    }
                } header: {
                    Text("Платежи")
                        .foregroundStyle(ClientBankTheme.primaryStart)
                }
            }
        }
        .navigationTitle("Кредит")
        .tint(ClientBankTheme.primaryStart)
        .refreshable {
            await viewModel.refreshCredit()
        }
        .task(id: "\(viewModel.credit.id)-\(creditsRefreshTrigger)") {
            await viewModel.refreshCredit()
        }
    }

    @ViewBuilder
    private func paymentRow(_ payment: CreditScheduledPayment) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(payment.titleLine)
                        .font(.subheadline.weight(.semibold))
                    Text(payment.dueAt.formatted(Self.paymentDueFormat))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(scheduleLineText(payment))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 6) {
                    Text("Всего к этому дню: \(payment.expectedTotal.formattedAmount) ₽")
                        .font(.subheadline.weight(.medium))
                        .multilineTextAlignment(.trailing)
                        .fixedSize(horizontal: false, vertical: true)
                    paymentStatusBadge(payment.status, title: payment.paymentStatusDisplayTitle)
                }
            }
            if viewModel.canRepayPaymentRow(payment) {
                let suggested = viewModel.suggestedRepayAmount(for: payment)
                Button("Оплатить") {
                    onRepay(suggested)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    private func scheduleLineText(_ p: CreditScheduledPayment) -> String {
        if let ad = p.amountDue, ad >= 0 {
            var s = "К оплате за день: \(ad.roundedToScale(2).formattedAmount) ₽"
            if let ap = p.amountPaid, ap > 0 {
                s += " · внесено \(ap.roundedToScale(2).formattedAmount) ₽"
            }
            if let ar = p.amountRemaining, ar > 0 {
                s += " · осталось \(ar.roundedToScale(2).formattedAmount) ₽"
            }
            return s
        }
        return "Накопительно по графику: \(p.expectedTotal.formattedAmount) ₽"
    }

    private func paymentStatusBadge(_ status: String, title: String) -> some View {
        let key = status.lowercased()
        let bg: Color
        let fg: Color
        switch key {
            case "paid":
                bg = ClientBankTheme.paymentBadgePaidBg
                fg = ClientBankTheme.statusActive
            case "overdue":
                bg = ClientBankTheme.paymentBadgeOverdueBg
                fg = ClientBankTheme.statusOverdue
            case "partial":
                bg = Color(red: 21 / 255, green: 101 / 255, blue: 192 / 255).opacity(0.14)
                fg = Color(red: 21 / 255, green: 101 / 255, blue: 192 / 255)
            default:
                bg = ClientBankTheme.paymentBadgePendingBg
                fg = ClientBankTheme.textSecondary
        }
        return Text(title)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(bg)
            .clipShape(Capsule())
            .foregroundStyle(fg)
    }

    private func creditStatusColor(_ key: String) -> Color {
        switch key {
            case "active": return ClientBankTheme.statusActive
            case "overdue": return ClientBankTheme.statusOverdue
            case "paid": return ClientBankTheme.statusPaidCredit
            default: return ClientBankTheme.textSecondary
        }
    }
}

#Preview {
    let credit = Credit(
        id: "00000000-0000-0000-0000-000000000010",
        clientId: "00000000-0000-0000-0000-000000000002",
        accountId: "00000000-0000-0000-0000-000000000001",
        tariffId: "00000000-0000-0000-0000-000000000020",
        amount: 100_000,
        remainingAmount: 80_000,
        issuedAt: Date(),
        tariffName: "Стандарт",
        rate: 0.12,
        dailyPayment: 39.45,
        status: "active")
    NavigationStack {
        CreditDetailView(
            viewModel: PreviewDependencies.factory.viewModelFactory.makeCreditDetailViewModel(
                credit: credit,
                clientId: "00000000-0000-0000-0000-000000000002"),
            creditsRefreshTrigger: 0,
            onRepay: { _ in },
            onOpenLinkedAccount: { _ in })
    }
}
