import SwiftUI

final class MainCoordinator {
    private let viewFactory: ViewFactoryProtocol
    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings

    init(
        viewFactory: ViewFactoryProtocol,
        accountRepository: AccountRepositoryProtocol,
        clientId: String,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings)
    {
        self.viewFactory = viewFactory
        self.accountRepository = accountRepository
        self.clientId = clientId
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
    }

    func start(onLogout: @escaping () -> Void) -> some View {
        MainCoordinatorView(
            viewFactory: viewFactory,
            accountRepository: accountRepository,
            clientId: clientId,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings,
            onLogout: onLogout)
    }
}

struct MainCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let accountRepository: AccountRepositoryProtocol
    let clientId: String
    let appSettingsRepository: AppSettingsRepositoryProtocol
    @Bindable var clientAppSettings: ClientAppSettings
    let onLogout: () -> Void

    @State private var selectedMainTab: MainTab = .accounts
    @State private var transferPrefillStore = TransferPrefillStore()
    @State private var accountsPath = NavigationPath()
    @State private var creditsPath = NavigationPath()
    @State private var sheetItem: SheetItem?
    @State private var accountsRefreshTrigger = 0
    @State private var creditsRefreshTrigger = 0
    @State private var settingsReady = false
    @State private var standaloneTransferViewModel: StandaloneTransferViewModel?

    var body: some View {
        TabView(selection: $selectedMainTab) {
            NavigationStack(path: $accountsPath) {
                AccountsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $accountsPath,
                    sheetItem: $sheetItem,
                    selectedMainTab: $selectedMainTab,
                    transferPrefillStore: transferPrefillStore,
                    accountsRefreshTrigger: accountsRefreshTrigger,
                    settingsReady: settingsReady,
                    onAppSettingsChanged: {
                        accountsRefreshTrigger += 1
                    })
            }
            .tabItem {
                Label("Счета", systemImage: "creditcard")
            }
            .tag(MainTab.accounts)

            NavigationStack {
                Group {
                    if let standaloneTransferViewModel {
                        StandaloneTransferView(viewModel: standaloneTransferViewModel)
                    } else {
                        ProgressView()
                    }
                }
                .onAppear {
                    guard standaloneTransferViewModel == nil else { return }
                    let vm = viewFactory.makeStandaloneTransferViewModel(
                        clientId: clientId,
                        prefillStore: transferPrefillStore)
                    vm.onAccountsChanged = {
                        accountsRefreshTrigger += 1
                    }
                    standaloneTransferViewModel = vm
                }
            }
            .tabItem {
                Label("Перевод", systemImage: "arrow.left.arrow.right")
            }
            .tag(MainTab.transfer)

            NavigationStack(path: $creditsPath) {
                CreditsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $creditsPath,
                    sheetItem: $sheetItem,
                    creditsRefreshTrigger: creditsRefreshTrigger,
                    onOpenLinkedAccount: openLinkedAccount)
            }
            .tabItem {
                Label("Кредиты", systemImage: "banknote")
            }
            .tag(MainTab.credits)

            NavigationStack {
                viewFactory.makeProfileView(
                    onLogout: onLogout,
                    onAppSettingsChanged: {
                        accountsRefreshTrigger += 1
                    })
            }
            .tabItem {
                Label("Профиль", systemImage: "person")
            }
            .tag(MainTab.profile)
        }
        .preferredColorScheme(clientAppSettings.preferredColorScheme)
        .sheet(item: $sheetItem) { item in
            sheetContent(for: item)
        }
        .task {
            await loadInitialSettings()
            settingsReady = true
        }
    }

    @ViewBuilder
    private func sheetContent(for item: SheetItem) -> some View {
        switch item {
            case let .deposit(account):
                viewFactory.makeDepositView(account: account) {
                    accountsRefreshTrigger += 1
                    sheetItem = nil
                }
            case let .withdraw(account):
                viewFactory.makeWithdrawView(account: account) {
                    accountsRefreshTrigger += 1
                    sheetItem = nil
                }
            case let .openAccount(openClientId):
                viewFactory.makeOpenAccountView(clientId: openClientId) {
                    accountsRefreshTrigger += 1
                    sheetItem = nil
                }
            case let .closeAccount(account):
                viewFactory.makeCloseAccountView(account: account) {
                    accountsRefreshTrigger += 1
                    sheetItem = nil
                    accountsPath = NavigationPath()
                }
            case let .takeCredit(openClientId):
                viewFactory.makeTakeCreditView(clientId: openClientId) {
                    creditsRefreshTrigger += 1
                    sheetItem = nil
                }
            case let .repayCredit(credit):
                viewFactory.makeRepayCreditView(credit: credit) {
                    creditsRefreshTrigger += 1
                    sheetItem = nil
                }
        }
    }

    private func loadInitialSettings() async {
        do {
            let s = try await appSettingsRepository.getSettings(appType: "client")
            clientAppSettings.apply(theme: s.theme, hiddenAccountIds: s.hiddenAccountIds)
        } catch {}
    }

    private func openLinkedAccount(_ accountId: String) {
        selectedMainTab = .accounts
        Task {
            guard let all = try? await accountRepository.getAccounts(clientId: clientId) else { return }
            guard let acc = all.first(where: { $0.id == accountId }) else { return }
            await MainActor.run {
                accountsPath.append(Route.accountDetail(acc))
            }
        }
    }
}
