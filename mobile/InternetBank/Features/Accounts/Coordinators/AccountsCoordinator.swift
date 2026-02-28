import SwiftUI

struct AccountsCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    @Binding var path: NavigationPath
    @Binding var sheetItem: SheetItem?

    var body: some View {
        viewFactory.makeAccountsListView(
            clientId: clientId,
            onAccountTap: { account in
                path.append(Route.accountDetail(account))
            },
            onOpenAccount: {
                sheetItem = .openAccount(clientId)
            }
        )
        .navigationDestination(for: Route.self) { route in
            switch route {
            case .accountDetail(let account):
                viewFactory.makeAccountDetailView(
                    account: account,
                    onDeposit: { sheetItem = .deposit(account) },
                    onWithdraw: { sheetItem = .withdraw(account) },
                    onHistory: { path.append(Route.operationHistory(account)) },
                    onCloseAccount: { sheetItem = .closeAccount(account) }
                )
            case .operationHistory(let account):
                viewFactory.makeOperationHistoryView(account: account)
            }
        }
    }
}
