import SwiftUI

protocol ViewFactoryProtocol: AnyObject {
    func makeLoginView(onSuccess: @escaping () -> Void) -> LoginView
    func makeAccountsListView(
        clientId: String,
        refreshTrigger: Int,
        settingsReady: Bool,
        onAppSettingsChanged: @escaping () -> Void,
        onAccountTap: @escaping (Account) -> Void,
        onOpenAccount: @escaping () -> Void) -> AccountsListView
    func makeAccountDetailView(
        account: Account,
        refreshTrigger: Int,
        onDeposit: @escaping () -> Void,
        onTopUpFromOtherAccount: @escaping () -> Void,
        onWithdraw: @escaping () -> Void,
        onOpenTransferTabFromHere: @escaping () -> Void,
        onHistory: @escaping () -> Void,
        onCloseAccount: @escaping () -> Void) -> AccountDetailView
    func makeDepositView(account: Account, onDismiss: @escaping () -> Void) -> DepositView
    func makeWithdrawView(account: Account, onDismiss: @escaping () -> Void) -> WithdrawView
    func makeStandaloneTransferViewModel(
        clientId: String,
        prefillStore: TransferPrefillStore) -> StandaloneTransferViewModel
    func makeOperationHistoryView(account: Account) -> OperationHistoryView
    func makeOpenAccountView(clientId: String, onDismiss: @escaping () -> Void) -> OpenAccountView
    func makeCloseAccountView(account: Account, onDismiss: @escaping () -> Void) -> CloseAccountView
    func makeCreditsListView(
        clientId: String,
        refreshTrigger: Int,
        onCreditTap: @escaping (Credit) -> Void,
        onTakeCredit: @escaping () -> Void) -> CreditsListView
    func makeTakeCreditView(clientId: String, onDismiss: @escaping () -> Void) -> TakeCreditView
    func makeRepayCreditView(
        credit: Credit,
        suggestedAmount: Decimal?,
        onDismiss: @escaping () -> Void) -> RepayCreditView
    func makeCreditDetailView(
        credit: Credit,
        clientId: String,
        creditsRefreshTrigger: Int,
        onRepay: @escaping (Decimal?) -> Void,
        onOpenLinkedAccount: @escaping (String) -> Void) -> CreditDetailView
    func makeProfileView(
        onLogout: @escaping () -> Void,
        onAppSettingsChanged: @escaping () -> Void) -> ProfileView
}
