import SwiftUI

struct AccountsListView: View {
    @Bindable var viewModel: AccountsListViewModel
    var refreshTrigger: Int
    var settingsReady: Bool
    var onAccountTap: (Account) -> Void
    var onOpenAccount: () -> Void

    init(
        viewModel: AccountsListViewModel,
        refreshTrigger: Int,
        settingsReady: Bool,
        onAccountTap: @escaping (Account) -> Void,
        onOpenAccount: @escaping () -> Void)
    {
        self.viewModel = viewModel
        self.refreshTrigger = refreshTrigger
        self.settingsReady = settingsReady
        self.onAccountTap = onAccountTap
        self.onOpenAccount = onOpenAccount
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Picker("Видимость", selection: $viewModel.selectedTab) {
                ForEach(AccountsListViewModel.VisibilityTab.allCases, id: \.self) { tab in
                    Text(tab.title).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal)
            }

            if viewModel.displayedAccounts.isEmpty {
                ContentUnavailableView(
                    "Нет счетов",
                    systemImage: "creditcard",
                    description: Text(
                        viewModel.selectedTab == .hidden
                            ? "Скрытых счетов пока нет"
                            : "Откройте счёт или проверьте вкладку «Скрытые»"))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView(.vertical, showsIndicators: false) {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.displayedAccounts) { account in
                            AccountSummaryCard(
                                account: account,
                                showsVisibilityToggle: true,
                                visibilityToggleShowsEyeForReveal: viewModel.selectedTab == .hidden,
                                onTap: { onAccountTap(account) },
                                onToggleVisibility: {
                                    Task {
                                        await viewModel.setAccountHidden(
                                            accountId: account.id,
                                            hidden: viewModel.selectedTab == .regular)
                                    }
                                })
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
            }
        }
        .navigationTitle("Мои счета")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    onOpenAccount()
                } label: {
                    HStack {
                        Text("Открыть счет")
                        Image(systemName: "plus.rectangle.on.rectangle")
                    }
                }
                .accessibilityLabel("Открыть счёт")
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
        .refreshable {
            await viewModel.loadAccounts()
        }
        .task(id: "\(refreshTrigger)-\(settingsReady)") {
            await viewModel.loadAccounts()
        }
    }
}

#Preview {
    let ra = RepositoryAssembly()
    let fa = FactoryAssembly(repositoryAssembly: ra)
    let vm = fa.viewModelFactory.makeAccountsListViewModel(
        clientId: "00000000-0000-0000-0000-000000000002",
        onAppSettingsChanged: {})
    NavigationStack {
        AccountsListView(
            viewModel: vm,
            refreshTrigger: 0,
            settingsReady: true,
            onAccountTap: { _ in },
            onOpenAccount: {})
    }
}
