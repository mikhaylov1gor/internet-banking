import SwiftUI

struct TakeCreditView: View {
    @Bindable var viewModel: TakeCreditViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Picker("Тариф", selection: $viewModel.selectedTariffId) {
                    ForEach(viewModel.tariffs) { tariff in
                        Text("\(tariff.name) — \(tariff.rate)%")
                            .tag(tariff.id)
                    }
                }
                .pickerStyle(.navigationLink)
                Picker("Счёт зачисления", selection: $viewModel.selectedAccountId) {
                    ForEach(viewModel.accounts) { account in
                        Text("\(account.displayAccountNumber) · \(account.balance.formattedAmount) \(account.currencySymbol)")
                            .tag(account.id)
                    }
                }
                .pickerStyle(.navigationLink)
                TextField("Сумма", text: $viewModel.amount)
                    .keyboardType(.decimalPad)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Button("Оформить кредит") {
                    Task { await viewModel.takeCredit() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Взять кредит")
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
