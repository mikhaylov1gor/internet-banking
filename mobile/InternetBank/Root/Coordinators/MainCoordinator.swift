import SwiftUI

final class MainCoordinator {
    private let viewFactory: ViewFactoryProtocol
    private let clientId: String
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings

    init(
        viewFactory: ViewFactoryProtocol,
        clientId: String,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings)
    {
        self.viewFactory = viewFactory
        self.clientId = clientId
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
    }

    func start(onLogout: @escaping () -> Void) -> some View {
        MainCoordinatorView(
            viewFactory: viewFactory,
            clientId: clientId,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings,
            onLogout: onLogout)
    }
}

struct MainCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    let appSettingsRepository: AppSettingsRepositoryProtocol
    @Bindable var clientAppSettings: ClientAppSettings
    let onLogout: () -> Void

    @State private var accountsPath = NavigationPath()
    @State private var creditsPath = NavigationPath()
    @State private var sheetItem: SheetItem?
    @State private var accountsRefreshTrigger = 0
    @State private var creditsRefreshTrigger = 0
    @State private var settingsReady = false

    var body: some View {
        TabView {
            NavigationStack(path: $accountsPath) {
                AccountsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $accountsPath,
                    sheetItem: $sheetItem,
                    accountsRefreshTrigger: accountsRefreshTrigger,
                    settingsReady: settingsReady,
                    onAppSettingsChanged: {
                        accountsRefreshTrigger += 1
                    })
            }
            .tabItem {
                Label("Счета", systemImage: "creditcard")
            }
            NavigationStack(path: $creditsPath) {
                CreditsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $creditsPath,
                    sheetItem: $sheetItem,
                    creditsRefreshTrigger: creditsRefreshTrigger)
            }
            .tabItem {
                Label("Кредиты", systemImage: "banknote")
            }
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
            case let .transfer(account):
                viewFactory.makeTransferView(account: account, clientId: clientId) {
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
            case .takeCredit:
                viewFactory.makeTakeCreditView(clientId: clientId) {
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
}
