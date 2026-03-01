import SwiftUI

struct RepayCreditView: View {
    @Bindable var viewModel: RepayCreditViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Picker("Счёт для списания", selection: $viewModel.selectedAccountId) {
                    ForEach(viewModel.accounts) { account in
                        Text("\(account.id.prefix(8))... \(account.balance.formattedAmount) ₽").tag(account.id)
                    }
                }
                TextField("Сумма", text: $viewModel.amount)
                    .keyboardType(.decimalPad)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                }
                Button("Погасить") {
                    Task { await viewModel.repay() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Погасить кредит")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
            .task {
                await viewModel.loadData()
            }
        }
    }
}
