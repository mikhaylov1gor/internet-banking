import Foundation

protocol ViewModelFactoryProtocol: AnyObject {
    func makeLoginViewModel() -> LoginViewModel
    func makeAccountsListViewModel(clientId: String, onAppSettingsChanged: @escaping () -> Void) -> AccountsListViewModel
    func makeAccountDetailViewModel(account: Account) -> AccountDetailViewModel
    func makeDepositViewModel(account: Account) -> DepositViewModel
    func makeWithdrawViewModel(account: Account) -> WithdrawViewModel
    func makeTransferViewModel(account: Account, clientId: String) -> TransferViewModel
    func makeOperationHistoryViewModel(account: Account) -> OperationHistoryViewModel
    func makeOpenAccountViewModel(clientId: String) -> OpenAccountViewModel
    func makeCloseAccountViewModel(account: Account) -> CloseAccountViewModel
    func makeCreditsListViewModel(clientId: String) -> CreditsListViewModel
    func makeTakeCreditViewModel(clientId: String) -> TakeCreditViewModel
    func makeRepayCreditViewModel(credit: Credit) -> RepayCreditViewModel
    func makeCreditDetailViewModel(credit: Credit, clientId: String) -> CreditDetailViewModel
    func makeProfileViewModel(onAppSettingsChanged: @escaping () -> Void) -> ProfileViewModel
}
