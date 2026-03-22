import SwiftUI

enum CreditsListAuxiliarySheet: String, Identifiable {
    case creditRating
    var id: String { rawValue }
}

struct CreditsListView: View {
    @Bindable var viewModel: CreditsListViewModel
    var refreshTrigger: Int
    var onCreditTap: (Credit) -> Void
    var onTakeCredit: () -> Void

    @State private var auxiliarySheet: CreditsListAuxiliarySheet?

    var body: some View {
        Group {
            if viewModel.credits.isEmpty {
                ContentUnavailableView(
                    "Нет кредитов",
                    systemImage: "banknote",
                    description: Text("Оформите кредит через кнопку выше."))
            } else {
                List {
                    ForEach(viewModel.credits) { credit in
                        Button {
                            onCreditTap(credit)
                        } label: {
                            CreditsListRowContent(credit: credit)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay {
            if viewModel.isLoading, viewModel.credits.isEmpty {
                ProgressView()
            }
        }
        .navigationTitle("Мои кредиты")
        .tint(ClientBankTheme.primaryStart)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    auxiliarySheet = .creditRating
                } label: {
                    Image(systemName: "chart.bar.doc.horizontal")
                }
                .accessibilityLabel("Рейтинг")
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    onTakeCredit()
                } label: {
                    Image(systemName: "plus.circle.fill")
                }
                .accessibilityLabel("Взять кредит")
            }
        }
        .refreshable {
            await viewModel.loadCredits()
        }
        .task(id: refreshTrigger) {
            await viewModel.loadCredits()
        }
        .sheet(item: $auxiliarySheet) { item in
            switch item {
                case .creditRating:
                    NavigationStack {
                        CreditRatingSheetContent(viewModel: viewModel)
                            .toolbar {
                                ToolbarItem(placement: .cancellationAction) {
                                    Button("Закрыть") {
                                        auxiliarySheet = nil
                                    }
                                }
                            }
                    }
                    .tint(ClientBankTheme.primaryStart)
            }
        }
    }
}

private struct CreditsListRowContent: View {
    let credit: Credit

    private var statusTint: Color {
        switch (credit.status ?? "").lowercased() {
            case "active": return ClientBankTheme.statusActive
            case "overdue": return ClientBankTheme.statusOverdue
            case "paid": return ClientBankTheme.statusPaidMuted
            default: return .secondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("Кредит")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ClientBankTheme.primaryStart)
                Text("#\(ClientBankFormat.formatShortId(credit.id))")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(ClientBankTheme.textAccent)
            }
            Text("Сумма: \(credit.amount.formattedAmount) ₽")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            if ["active", "overdue"].contains((credit.status ?? "").lowercased()) {
                Text("Остаток: \(credit.remainingAmount.formattedAmount) ₽")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                if let daily = credit.dailyPaymentRounded {
                    Text("Ежедневный платеж: \(daily.formattedAmount) ₽")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            if let pct = credit.displayAnnualRatePercent {
                Text("Ставка: \(pct.formattedAmount)%")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Text("Статус: \(credit.statusDisplayTitle)")
                .font(.caption)
                .foregroundStyle(statusTint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }
}

private struct CreditRatingSheetContent: View {
    @Bindable var viewModel: CreditsListViewModel

    var body: some View {
        Form {
            if viewModel.isLoadingRating {
                ProgressView()
            }
            if let ratingError = viewModel.ratingError {
                Text(ratingError)
                    .foregroundStyle(ClientBankTheme.statusOverdue)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let r = viewModel.creditRating {
                Section {
                    LabeledContent("Балл") {
                        Text("\(r.score)")
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                    LabeledContent("Уровень риска") {
                        Text(r.riskLevel)
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    LabeledContent("Количество просрочек") {
                        Text("\(r.overdueCount)")
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                    LabeledContent("Сумма просрочек") {
                        Text("\(Decimal(r.overdueAmount).formattedAmount) ₽")
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
        .navigationTitle("Рейтинг")
        .task {
            await viewModel.loadCreditRating()
        }
    }
}

#Preview {
    let vm = PreviewDependencies.factory.viewModelFactory.makeCreditsListViewModel(
        clientId: "00000000-0000-0000-0000-000000000002")
    NavigationStack {
        CreditsListView(
            viewModel: vm,
            refreshTrigger: 0,
            onCreditTap: { _ in },
            onTakeCredit: {})
    }
}
