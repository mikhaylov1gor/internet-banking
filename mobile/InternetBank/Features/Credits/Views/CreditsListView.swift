import SwiftUI

struct CreditsListView: View {
    @Bindable var viewModel: CreditsListViewModel
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
                        Text("Остаток: \(credit.remainingAmount) ₽")
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
        .task {
            await viewModel.loadCredits()
        }
    }
}
