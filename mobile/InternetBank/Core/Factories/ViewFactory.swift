import SwiftUI

final class ViewFactory: ViewFactoryProtocol {
    private let viewModelFactory: ViewModelFactoryProtocol

    init(viewModelFactory: ViewModelFactoryProtocol) {
        self.viewModelFactory = viewModelFactory
    }

    func makeLoginView(onSuccess: @escaping () -> Void) -> LoginView {
        let viewModel = viewModelFactory.makeLoginViewModel()
        viewModel.onLoginSuccess = onSuccess
        return LoginView(viewModel: viewModel)
    }

    func makeAccountsListView(
        clientId: String,
        onAccountTap: @escaping (Account) -> Void,
        onOpenAccount: @escaping () -> Void) -> AccountsListView
    {
        AccountsListView(
            viewModel: viewModelFactory.makeAccountsListViewModel(clientId: clientId),
            onAccountTap: onAccountTap,
            onOpenAccount: onOpenAccount)
    }

    func makeAccountDetailView(
        account: Account,
        onDeposit: @escaping () -> Void,
        onWithdraw: @escaping () -> Void,
        onHistory: @escaping () -> Void,
        onCloseAccount: @escaping () -> Void) -> AccountDetailView
    {
        AccountDetailView(
            viewModel: viewModelFactory.makeAccountDetailViewModel(account: account),
            onDeposit: onDeposit,
            onWithdraw: onWithdraw,
            onHistory: onHistory,
            onCloseAccount: onCloseAccount)
    }

    func makeDepositView(account: Account, onDismiss: @escaping () -> Void) -> DepositView {
        let viewModel = viewModelFactory.makeDepositViewModel(account: account)
        viewModel.onSuccess = onDismiss
        return DepositView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeWithdrawView(account: Account, onDismiss: @escaping () -> Void) -> WithdrawView {
        let viewModel = viewModelFactory.makeWithdrawViewModel(account: account)
        viewModel.onSuccess = onDismiss
        return WithdrawView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeOperationHistoryView(account: Account) -> OperationHistoryView {
        OperationHistoryView(viewModel: viewModelFactory.makeOperationHistoryViewModel(account: account))
    }

    func makeOpenAccountView(clientId: String, onDismiss: @escaping () -> Void) -> OpenAccountView {
        let viewModel = viewModelFactory.makeOpenAccountViewModel(clientId: clientId)
        viewModel.onSuccess = { _ in onDismiss() }
        return OpenAccountView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeCloseAccountView(account: Account, onDismiss: @escaping () -> Void) -> CloseAccountView {
        let viewModel = viewModelFactory.makeCloseAccountViewModel(account: account)
        viewModel.onSuccess = onDismiss
        return CloseAccountView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeCreditsListView(
        clientId: String,
        onCreditTap: @escaping (Credit) -> Void,
        onTakeCredit: @escaping () -> Void) -> CreditsListView
    {
        CreditsListView(
            viewModel: viewModelFactory.makeCreditsListViewModel(clientId: clientId),
            onCreditTap: onCreditTap,
            onTakeCredit: onTakeCredit)
    }

    func makeTakeCreditView(clientId: String, onDismiss: @escaping () -> Void) -> TakeCreditView {
        let viewModel = viewModelFactory.makeTakeCreditViewModel(clientId: clientId)
        viewModel.onSuccess = { _ in onDismiss() }
        return TakeCreditView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeRepayCreditView(credit: Credit, onDismiss: @escaping () -> Void) -> RepayCreditView {
        let viewModel = viewModelFactory.makeRepayCreditViewModel(credit: credit)
        viewModel.onSuccess = onDismiss
        return RepayCreditView(viewModel: viewModel, onDismiss: onDismiss)
    }

    func makeProfileView(clientId: String, onLogout: @escaping () -> Void) -> ProfileView {
        ProfileView(viewModel: viewModelFactory.makeProfileViewModel(clientId: clientId), onLogout: onLogout)
    }
}
