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

#Preview {
    let credit = Credit(
        id: "00000000-0000-0000-0000-000000000010",
        clientId: "00000000-0000-0000-0000-000000000002",
        accountId: "00000000-0000-0000-0000-000000000001",
        tariffId: "00000000-0000-0000-0000-000000000020",
        amount: 100_000,
        remainingAmount: 80_000,
        issuedAt: Date(),
        tariffName: nil,
        rate: 12,
        status: "active")
    let vm = PreviewDependencies.factory.viewModelFactory.makeRepayCreditViewModel(
        credit: credit,
        suggestedAmount: 12_345)
    RepayCreditView(viewModel: vm, onDismiss: {})
}
