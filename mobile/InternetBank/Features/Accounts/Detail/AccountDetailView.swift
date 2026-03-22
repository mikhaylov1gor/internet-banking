import SwiftUI

struct AccountDetailView: View {
    @Bindable var viewModel: AccountDetailViewModel
    var refreshTrigger: Int
    var onDeposit: () -> Void
    var onWithdraw: () -> Void
    var onTransfer: () -> Void
    var onHistory: () -> Void
    var onCloseAccount: () -> Void

    var body: some View {
        List {
            Section {
                AccountSummaryCard(account: viewModel.account)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden, edges: .all)
            }
            Section {
                Button("Внести деньги") { onDeposit() }
                Button("Снять деньги") { onWithdraw() }
                Button("Перевод на другой счёт") { onTransfer() }
                Button("История операций") { onHistory() }
                Button("Закрыть счёт", role: .destructive) { onCloseAccount() }
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
            onWithdraw: {},
            onTransfer: {},
            onHistory: {},
            onCloseAccount: {})
    }
}
