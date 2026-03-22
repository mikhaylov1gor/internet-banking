import SwiftUI

struct AccountsCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    @Binding var path: NavigationPath
    @Binding var sheetItem: SheetItem?
    @Binding var selectedMainTab: MainTab
    var transferPrefillStore: TransferPrefillStore
    let accountsRefreshTrigger: Int
    let settingsReady: Bool
    let onAppSettingsChanged: () -> Void

    var body: some View {
        viewFactory.makeAccountsListView(
            clientId: clientId,
            refreshTrigger: accountsRefreshTrigger,
            settingsReady: settingsReady,
            onAppSettingsChanged: onAppSettingsChanged,
            onAccountTap: { account in
                path.append(Route.accountDetail(account))
            },
            onOpenAccount: {
                sheetItem = .openAccount(clientId)
            })
            .navigationDestination(for: Route.self) { route in
                switch route {
                    case let .accountDetail(account):
                        viewFactory.makeAccountDetailView(
                            account: account,
                            refreshTrigger: accountsRefreshTrigger,
                            onDeposit: { sheetItem = .deposit(account) },
                            onTopUpFromOtherAccount: {
                                transferPrefillStore.request(from: nil, to: account.id)
                                selectedMainTab = .transfer
                            },
                            onWithdraw: { sheetItem = .withdraw(account) },
                            onOpenTransferTabFromHere: {
                                transferPrefillStore.request(from: account.id, to: nil)
                                selectedMainTab = .transfer
                            },
                            onHistory: { path.append(Route.operationHistory(account)) },
                            onCloseAccount: { sheetItem = .closeAccount(account) })
                    case let .operationHistory(account):
                        viewFactory.makeOperationHistoryView(account: account)
                }
            }
    }
}
