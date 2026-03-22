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
                    VStack(alignment: .leading, spacing: 4) {
                        Text(credit.tariffName ?? "Кредит")
                        Text("Остаток: \(credit.remainingAmount.formattedAmount) ₽")
                            .font(.caption)
                        Text(credit.statusDisplayTitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Мои кредиты")
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Мой кредитный рейтинг") {
                    auxiliarySheet = .creditRating
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Взять кредит") {
                    onTakeCredit()
                }
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
            }
            if let r = viewModel.creditRating {
                LabeledContent("Балл") {
                    Text("\(r.score)")
                }
                LabeledContent("Уровень риска") {
                    Text(r.riskLevel)
                }
                LabeledContent("Количество просрочек") {
                    Text("\(r.overdueCount)")
                }
                LabeledContent("Сумма просрочек") {
                    Text("\(Decimal(r.overdueAmount).formattedAmount) ₽")
                }
            }
        }
        .navigationTitle("Мой кредитный рейтинг")
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
