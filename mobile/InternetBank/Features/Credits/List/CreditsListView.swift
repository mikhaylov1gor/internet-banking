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
        List {
            ForEach(viewModel.credits) { credit in
                Button {
                    onCreditTap(credit)
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(credit.tariffName ?? "Кредит")
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("Остаток: \(credit.remainingAmount.formattedAmount) ₽")
                            .font(.caption)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(credit.statusDisplayTitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Мои кредиты")
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
            }
        }
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
                    .foregroundStyle(.red)
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
