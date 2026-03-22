import SwiftUI

struct RepayCreditView: View {
    @Bindable var viewModel: RepayCreditViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Picker("Счёт для списания", selection: $viewModel.selectedAccountId) {
                    ForEach(viewModel.accounts) { account in
                        Text("\(account.displayAccountNumber) · \(account.balance.formattedAmount) \(account.currencySymbol)")
                            .tag(account.id)
                    }
                }
                .pickerStyle(.menu)
                TextField("Сумма", text: $viewModel.amount)
                    .keyboardType(.decimalPad)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
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
