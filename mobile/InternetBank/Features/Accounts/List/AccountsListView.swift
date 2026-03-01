import SwiftUI

struct AccountsListView: View {
    @State private var viewModel: AccountsListViewModel
    var refreshTrigger: Int
    var onAccountTap: (Account) -> Void
    var onOpenAccount: () -> Void

    init(
        viewModel: AccountsListViewModel,
        refreshTrigger: Int,
        onAccountTap: @escaping (Account) -> Void,
        onOpenAccount: @escaping () -> Void)
    {
        _viewModel = State(initialValue: viewModel)
        self.refreshTrigger = refreshTrigger
        self.onAccountTap = onAccountTap
        self.onOpenAccount = onOpenAccount
    }

    var body: some View {
        List {
            ForEach(viewModel.accounts) { account in
                Button {
                    onAccountTap(account)
                } label: {
                    HStack {
                        Text("Счёт \(account.id.prefix(8))...")
                        Spacer()
                        Text("\(account.balance.formattedAmount) ₽")
                    }
                }
            }
        }
        .navigationTitle("Мои счета")
        .toolbar {
            Button("Открыть счёт") {
                onOpenAccount()
            }
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
        .refreshable {
            await viewModel.loadAccounts()
        }
        .task(id: refreshTrigger) {
            await viewModel.loadAccounts()
        }
    }
}
