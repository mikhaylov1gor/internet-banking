import SwiftUI

final class MainCoordinator {
    private let viewFactory: ViewFactoryProtocol
    private let clientId: String

    init(viewFactory: ViewFactoryProtocol, clientId: String) {
        self.viewFactory = viewFactory
        self.clientId = clientId
    }

    func start(onLogout: @escaping () -> Void) -> some View {
        MainCoordinatorView(
            viewFactory: viewFactory,
            clientId: clientId,
            onLogout: onLogout)
    }
}

struct MainCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    let onLogout: () -> Void

    @State private var accountsPath = NavigationPath()
    @State private var creditsPath = NavigationPath()
    @State private var sheetItem: SheetItem?
    @State private var accountsRefreshTrigger = 0
    @State private var creditsRefreshTrigger = 0

    var body: some View {
        TabView {
            NavigationStack(path: $accountsPath) {
                AccountsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $accountsPath,
                    sheetItem: $sheetItem,
                    accountsRefreshTrigger: accountsRefreshTrigger)
            }
            .tabItem {
                Label("Счета", systemImage: "creditcard")
            }
            NavigationStack(path: $creditsPath) {
                CreditsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    sheetItem: $sheetItem,
                    creditsRefreshTrigger: creditsRefreshTrigger)
            }
            .tabItem {
                Label("Кредиты", systemImage: "banknote")
            }
            viewFactory.makeProfileView(clientId: clientId, onLogout: onLogout)
                .tabItem {
                    Label("Профиль", systemImage: "person")
                }
        }
        .sheet(item: $sheetItem) { item in
            sheetContent(for: item)
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
            case .openAccount:
                viewFactory.makeOpenAccountView(clientId: clientId) {
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
}
