import SwiftUI

struct AccountDetailView: View {
    @Bindable var viewModel: AccountDetailViewModel
    var refreshTrigger: Int
    var onDeposit: () -> Void
    var onTopUpFromOtherAccount: () -> Void
    var onWithdraw: () -> Void
    var onOpenTransferTabFromHere: () -> Void
    var onHistory: () -> Void
    var onCloseAccount: () -> Void

    private var canCloseAccount: Bool {
        viewModel.account.balance == 0 && viewModel.account.status == "active"
    }

    var body: some View {
        List {
            Section {
                AccountSummaryCard(account: viewModel.account)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden, edges: .all)
            }
            Section {
                CopyableTruncatedIdRow(title: "Счёт", uuid: viewModel.account.id)
                LabeledContent("Статус") {
                    Text(viewModel.account.statusDisplayTitle)
                }
                Text("Открыт: \(viewModel.account.openedAt.formatted(date: .numeric, time: .omitted))")
                    .foregroundStyle(.secondary)
            }
            if viewModel.account.status == "active" {
                Section {
                    Button("Пополнить счёт", action: onDeposit)
                    Button("Пополнить с другого счёта", action: onTopUpFromOtherAccount)
                        .disabled(viewModel.otherActiveAccounts.isEmpty)
                    Button("Снять средства", action: onWithdraw)
                    Button("Перевести", action: onOpenTransferTabFromHere)
                    Button("Закрыть счёт", role: .destructive, action: onCloseAccount)
                        .disabled(!canCloseAccount)
                }
            }
            Section {
                Button("История операций", action: onHistory)
            }
        }
        .navigationTitle("Счёт")
        .refreshable {
            await viewModel.refresh()
        }
        .task(id: refreshTrigger) {
            await viewModel.refresh()
            viewModel.startRealtimeUpdates()
        }
        .onDisappear {
            viewModel.stopRealtimeUpdates()
        }
    }
}

#Preview {
    let account = Account(
        id: "00000000-0000-0000-0000-000000000001",
        clientId: "00000000-0000-0000-0000-000000000002",
        balance: 1500.50,
        currency: "RUB",
        openedAt: Date(),
        status: "active")
    NavigationStack {
        AccountDetailView(
            viewModel: PreviewDependencies.factory.viewModelFactory.makeAccountDetailViewModel(
                account: account),
            refreshTrigger: 0,
            onDeposit: {},
            onTopUpFromOtherAccount: {},
            onWithdraw: {},
            onOpenTransferTabFromHere: {},
            onHistory: {},
            onCloseAccount: {})
    }
}
