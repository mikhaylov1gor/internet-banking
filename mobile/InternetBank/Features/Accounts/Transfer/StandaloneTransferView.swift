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
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if viewModel.didSucceed {
                Section {
                    Text("Перевод выполнен")
                        .font(.headline)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("Средства зачислены на счёт получателя.")
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Button("Новый перевод") {
                        viewModel.resetForNewTransfer()
                    }
                }
            } else if viewModel.pickableFromAccounts.isEmpty {
                Text("Нет активных счетов для перевода")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Section {
                    Picker("Счёт списания", selection: $viewModel.fromAccountId) {
                        ForEach(viewModel.pickableFromAccounts) { acc in
                            Text(accountPickerLabel(acc))
                                .tag(acc.id)
                        }
                    }
                    .pickerStyle(.navigationLink)
                    .onChange(of: viewModel.fromAccountId) { _, _ in
                        viewModel.syncPickersAfterFromAccountChange()
                    }
                    if let from = viewModel.fromAccount {
                        Text("Доступно: \(from.balance.formattedAmount) \(from.currencySymbol)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Section {
                    Picker("Получатель", selection: $viewModel.recipientMode) {
                        ForEach(TransferRecipientMode.allCases, id: \.self) { mode in
                            Text(mode.title).tag(mode)
                        }
                    }
                    .pickerStyle(.menu)
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
                                    .multilineTextAlignment(.leading)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .fixedSize(horizontal: false, vertical: true)
                            } else {
                                Picker("Счёт зачисления", selection: $viewModel.toAccountId) {
                                    ForEach(viewModel.toCandidates) { acc in
                                        Text(accountPickerLabel(acc))
                                            .tag(acc.id)
                                    }
                                }
                                .pickerStyle(.navigationLink)
                            }
                        case .other:
                            TextField("Номер счёта или UUID получателя", text: $viewModel.otherAccountIdText)
                                .textContentType(.none)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                            Text("Укажите номер счёта (16 цифр) или UUID — как в реквизитах.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .fixedSize(horizontal: false, vertical: true)
                    }
                }
                if viewModel.showDifferentCurrencyHint {
                    Section {
                        Text("Если валюты счетов различаются, сумма к зачислению рассчитывается по курсу банка на момент операции.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
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

    private func accountPickerLabel(_ acc: Account) -> String {
        "\(acc.displayAccountNumber) · \(acc.balance.formattedAmount) \(acc.currencySymbol) · \(acc.currency)"
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
