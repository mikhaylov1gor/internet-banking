import SwiftUI

struct AccountsListView: View {
    @Bindable var viewModel: AccountsListViewModel
    var refreshTrigger: Int
    var onAccountTap: (Account) -> Void
    var onOpenAccount: () -> Void

    var body: some View {
        List {
            ForEach(viewModel.accounts) { account in
                Button {
                    onAccountTap(account)
                } label: {
                    HStack {
                        Text("Счёт \(account.id.prefix(8))...")
                        Spacer()
                        Text("\(account.balance) ₽")
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
