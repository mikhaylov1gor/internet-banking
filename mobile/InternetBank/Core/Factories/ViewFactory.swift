import SwiftUI

final class ViewFactory: ViewFactoryProtocol {
    private let viewModelFactory: ViewModelFactoryProtocol
    private let authRepository: AuthRepositoryProtocol

    init(viewModelFactory: ViewModelFactoryProtocol, authRepository: AuthRepositoryProtocol) {
        self.viewModelFactory = viewModelFactory
        self.authRepository = authRepository
    }

    func makeLoginView(onSuccess: @escaping () -> Void) -> LoginView {
        LoginView(authRepository: authRepository, onLoginSuccess: onSuccess)
    }

    func makeAccountsListView(
        clientId: String,
        refreshTrigger: Int,
        settingsReady: Bool,
        onAppSettingsChanged: @escaping () -> Void,
        onAccountTap: @escaping (Account) -> Void,
        onOpenAccount: @escaping () -> Void) -> AccountsListView
    {
        AccountsListView(
            viewModel: viewModelFactory.makeAccountsListViewModel(
                clientId: clientId,
                onAppSettingsChanged: onAppSettingsChanged),
            refreshTrigger: refreshTrigger,
            settingsReady: settingsReady,
            onAccountTap: onAccountTap,
            onOpenAccount: onOpenAccount)
    }

    func makeAccountDetailView(
        account: Account,
        refreshTrigger: Int,
        onDeposit: @escaping () -> Void,
        onTopUpFromOtherAccount: @escaping () -> Void,
        onWithdraw: @escaping () -> Void,
        onOpenTransferTabFromHere: @escaping () -> Void,
        onHistory: @escaping () -> Void,
        onCloseAccount: @escaping () -> Void) -> AccountDetailView
    {
        AccountDetailView(
            viewModel: viewModelFactory.makeAccountDetailViewModel(account: account),
            refreshTrigger: refreshTrigger,
            onDeposit: onDeposit,
            onTopUpFromOtherAccount: onTopUpFromOtherAccount,
            onWithdraw: onWithdraw,
            onOpenTransferTabFromHere: onOpenTransferTabFromHere,
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

    func makeStandaloneTransferViewModel(
        clientId: String,
        prefillStore: TransferPrefillStore) -> StandaloneTransferViewModel
    {
        viewModelFactory.makeStandaloneTransferViewModel(
            clientId: clientId,
            prefillStore: prefillStore)
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
        refreshTrigger: Int,
        onCreditTap: @escaping (Credit) -> Void,
        onTakeCredit: @escaping () -> Void) -> CreditsListView
    {
        CreditsListView(
            viewModel: viewModelFactory.makeCreditsListViewModel(clientId: clientId),
            refreshTrigger: refreshTrigger,
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

    func makeCreditDetailView(
        credit: Credit,
        clientId: String,
        onRepay: @escaping () -> Void,
        onOpenLinkedAccount: @escaping (String) -> Void) -> CreditDetailView
    {
        CreditDetailView(
            viewModel: viewModelFactory.makeCreditDetailViewModel(credit: credit, clientId: clientId),
            onRepay: onRepay,
            onOpenLinkedAccount: onOpenLinkedAccount)
    }

    func makeProfileView(
        onLogout: @escaping () -> Void,
        onAppSettingsChanged: @escaping () -> Void) -> ProfileView
    {
        ProfileView(
            viewModel: viewModelFactory.makeProfileViewModel(
                onAppSettingsChanged: onAppSettingsChanged),
            onLogout: onLogout)
    }
}
