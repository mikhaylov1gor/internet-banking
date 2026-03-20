import SwiftUI

protocol ViewModelFactoryProtocol: AnyObject {
    func makeLoginViewModel() -> LoginViewModel
    func makeAccountsListViewModel(clientId: String) -> AccountsListViewModel
    func makeAccountDetailViewModel(account: Account) -> AccountDetailViewModel
    func makeDepositViewModel(account: Account) -> DepositViewModel
    func makeWithdrawViewModel(account: Account) -> WithdrawViewModel
    func makeOperationHistoryViewModel(account: Account) -> OperationHistoryViewModel
    func makeOpenAccountViewModel(clientId: String) -> OpenAccountViewModel
    func makeCloseAccountViewModel(account: Account) -> CloseAccountViewModel
    func makeCreditsListViewModel(clientId: String) -> CreditsListViewModel
    func makeTakeCreditViewModel(clientId: String) -> TakeCreditViewModel
    func makeRepayCreditViewModel(credit: Credit) -> RepayCreditViewModel
    func makeProfileViewModel(clientId: String) -> ProfileViewModel
}
