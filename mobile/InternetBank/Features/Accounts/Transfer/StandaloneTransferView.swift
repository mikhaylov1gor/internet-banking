import SwiftUI

struct StandaloneTransferView: View {
    @Bindable var viewModel: StandaloneTransferViewModel

    var body: some View {
        Form {
            if viewModel.isLoading && viewModel.accounts.isEmpty {
                ProgressView()
            }
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }
            if viewModel.didSucceed {
                Section {
                    Text("Перевод выполнен")
                        .font(.headline)
                    Text("Средства зачислены на счёт получателя.")
                        .foregroundStyle(.secondary)
                    Button("Новый перевод") {
                        viewModel.resetForNewTransfer()
                    }
                }
            } else if viewModel.pickableFromAccounts.isEmpty {
                Text("Нет активных счетов для перевода")
                    .foregroundStyle(.secondary)
            } else {
                Section {
                    Picker("Счёт списания", selection: $viewModel.fromAccountId) {
                        ForEach(viewModel.pickableFromAccounts) { acc in
                            Text("···\(String(acc.id.suffix(8))) · \(acc.balance.formattedAmount) \(acc.currencySymbol)")
                                .tag(acc.id)
                        }
                    }
                    .onChange(of: viewModel.fromAccountId) { _, _ in
                        viewModel.syncPickersAfterFromAccountChange()
                    }
                    if let from = viewModel.fromAccount {
                        Text("Доступно: \(from.balance.formattedAmount) \(from.currencySymbol)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                Section {
                    Picker("Получатель", selection: $viewModel.recipientMode) {
                        ForEach(TransferRecipientMode.allCases, id: \.self) { mode in
                            Text(mode.title).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: viewModel.recipientMode) { _, newValue in
                        if newValue == .own {
                            viewModel.syncPickersAfterFromAccountChange()
                        }
                    }
                    switch viewModel.recipientMode {
                        case .own:
                            if viewModel.toCandidates.isEmpty {
                                Text("Нет другого активного счёта")
                                    .foregroundStyle(.secondary)
                            } else {
                                Picker("Счёт зачисления", selection: $viewModel.toAccountId) {
                                    ForEach(viewModel.toCandidates) { acc in
                                        Text("···\(String(acc.id.suffix(8))) · \(acc.balance.formattedAmount) \(acc.currencySymbol)")
                                            .tag(acc.id)
                                    }
                                }
                            }
                        case .other:
                            TextField("Номер счёта получателя (UUID)", text: $viewModel.otherAccountIdText)
                                .textContentType(.none)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                            Text("Укажите номер счёта получателя (UUID), например из реквизитов.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                    }
                }
                if viewModel.showDifferentCurrencyHint {
                    Section {
                        Text("Если валюты счетов различаются, сумма к зачислению рассчитывается по курсу банка на момент операции.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                Section {
                    TextField("Сумма списания", text: $viewModel.amount)
                        .keyboardType(.decimalPad)
                    Button("Перевести") {
                        Task { await viewModel.submitTransfer() }
                    }
                    .disabled(viewModel.isSubmitting || !viewModel.canSubmit)
                }
            }
        }
        .navigationTitle("Перевод")
        .task(id: viewModel.prefillStore.revision) {
            await viewModel.loadAccounts()
            viewModel.applyPrefillFromStore()
        }
    }
}

#Preview {
    let store = TransferPrefillStore()
    let vm = PreviewDependencies.factory.viewModelFactory.makeStandaloneTransferViewModel(
        clientId: "00000000-0000-0000-0000-000000000002",
        prefillStore: store)
    NavigationStack {
        StandaloneTransferView(viewModel: vm)
    }
}
