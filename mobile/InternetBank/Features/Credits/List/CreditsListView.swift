import SwiftUI

struct CreditsListView: View {
    @Bindable var viewModel: CreditsListViewModel
    var refreshTrigger: Int
    var onCreditTap: (Credit) -> Void
    var onTakeCredit: () -> Void

    var body: some View {
        List {
            ForEach(viewModel.credits) { credit in
                Button {
                    onCreditTap(credit)
                } label: {
                    VStack(alignment: .leading) {
                        Text(credit.tariffName ?? "Кредит")
                        Text("Остаток: \(credit.remainingAmount.formattedAmount) ₽")
                            .font(.caption)
                    }
                }
            }
        }
        .navigationTitle("Мои кредиты")
        .toolbar {
            Button("Взять кредит") {
                onTakeCredit()
            }
        }
        .refreshable {
            await viewModel.loadCredits()
        }
        .task(id: refreshTrigger) {
            await viewModel.loadCredits()
        }
    }
}
