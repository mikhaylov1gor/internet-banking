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
            onLogout: onLogout
        )
    }
}

struct MainCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    let onLogout: () -> Void

    @State private var accountsPath = NavigationPath()
    @State private var creditsPath = NavigationPath()
    @State private var sheetItem: SheetItem?

    var body: some View {
        TabView {
            NavigationStack(path: $accountsPath) {
                AccountsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    path: $accountsPath,
                    sheetItem: $sheetItem
                )
            }
            .tabItem {
                Label("Счета", systemImage: "creditcard")
            }
            NavigationStack(path: $creditsPath) {
                CreditsCoordinatorView(
                    viewFactory: viewFactory,
                    clientId: clientId,
                    sheetItem: $sheetItem
                )
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
        case .deposit(let account):
            viewFactory.makeDepositView(account: account) {
                sheetItem = nil
            }
        case .withdraw(let account):
            viewFactory.makeWithdrawView(account: account) {
                sheetItem = nil
            }
        case .openAccount:
            viewFactory.makeOpenAccountView(clientId: clientId) {
                sheetItem = nil
            }
        case .closeAccount(let account):
            viewFactory.makeCloseAccountView(account: account) {
                sheetItem = nil
                accountsPath = NavigationPath()
            }
        case .takeCredit:
            viewFactory.makeTakeCreditView(clientId: clientId) {
                sheetItem = nil
            }
        case .repayCredit(let credit):
            viewFactory.makeRepayCreditView(credit: credit) {
                sheetItem = nil
            }
        }
    }
}
