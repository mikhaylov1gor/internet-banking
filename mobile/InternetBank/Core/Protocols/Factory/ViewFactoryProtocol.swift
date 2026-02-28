import SwiftUI

protocol ViewFactoryProtocol: AnyObject {
    func makeLoginView(onSuccess: @escaping () -> Void) -> LoginView
    func makeAccountsListView(clientId: String, onAccountTap: @escaping (Account) -> Void, onOpenAccount: @escaping () -> Void) -> AccountsListView
    func makeAccountDetailView(account: Account, onDeposit: @escaping () -> Void, onWithdraw: @escaping () -> Void, onHistory: @escaping () -> Void, onCloseAccount: @escaping () -> Void) -> AccountDetailView
    func makeDepositView(account: Account, onDismiss: @escaping () -> Void) -> DepositView
    func makeWithdrawView(account: Account, onDismiss: @escaping () -> Void) -> WithdrawView
    func makeOperationHistoryView(account: Account) -> OperationHistoryView
    func makeOpenAccountView(clientId: String, onDismiss: @escaping () -> Void) -> OpenAccountView
    func makeCloseAccountView(account: Account, onDismiss: @escaping () -> Void) -> CloseAccountView
    func makeCreditsListView(clientId: String, onCreditTap: @escaping (Credit) -> Void, onTakeCredit: @escaping () -> Void) -> CreditsListView
    func makeTakeCreditView(clientId: String, onDismiss: @escaping () -> Void) -> TakeCreditView
    func makeRepayCreditView(credit: Credit, onDismiss: @escaping () -> Void) -> RepayCreditView
    func makeProfileView(clientId: String, onLogout: @escaping () -> Void) -> ProfileView
}
