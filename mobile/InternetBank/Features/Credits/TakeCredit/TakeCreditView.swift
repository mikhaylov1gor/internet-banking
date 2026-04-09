import SwiftUI

struct TakeCreditView: View {
    @Bindable var viewModel: TakeCreditViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Тариф", selection: $viewModel.selectedTariffId) {
                        ForEach(viewModel.tariffs) { tariff in
                            Text("\(tariff.name) — \(tariff.displayAnnualPercent.formattedAmount)%")
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
                    .pickerStyle(.menu)
                }
                Section {
                    TextField("Сумма", text: $viewModel.amount)
                        .keyboardType(.decimalPad)
                    TextField("Срок, мес.", text: $viewModel.termMonthsText)
                        .keyboardType(.numberPad)
                } footer: {
                    Text("Срок кредита от 1 до \(CreditTermLimits.maxMonths) месяцев.")
                        .font(.footnote)
                }
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
                    Button("Оформить кредит") {
                        Task { await viewModel.takeCredit() }
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .navigationTitle("Взять кредит")
            .navigationBarTitleDisplayMode(.inline)
            .tint(ClientBankTheme.primaryStart)
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
    TakeCreditView(
        viewModel: PreviewDependencies.factory.viewModelFactory.makeTakeCreditViewModel(
            clientId: "00000000-0000-0000-0000-000000000002"),
        onDismiss: {})
}
