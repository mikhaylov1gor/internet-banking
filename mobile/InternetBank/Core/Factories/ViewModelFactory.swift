import Foundation

final class ViewModelFactory: ViewModelFactoryProtocol {
    private let accountRepository: AccountRepositoryProtocol
    private let creditRepository: CreditRepositoryProtocol
    private let authRepository: AuthRepositoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings
    private let makeAccountOperationsWebSocket: () -> AccountOperationsWebSocketProtocol

    init(
        accountRepository: AccountRepositoryProtocol,
        creditRepository: CreditRepositoryProtocol,
        authRepository: AuthRepositoryProtocol,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings,
        makeAccountOperationsWebSocket: @escaping () -> AccountOperationsWebSocketProtocol)
    {
        self.accountRepository = accountRepository
        self.creditRepository = creditRepository
        self.authRepository = authRepository
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
        self.makeAccountOperationsWebSocket = makeAccountOperationsWebSocket
    }

    func makeLoginViewModel() -> LoginViewModel {
        LoginViewModel(authRepository: authRepository)
    }

    func makeAccountsListViewModel(clientId: String, onAppSettingsChanged: @escaping () -> Void) -> AccountsListViewModel {
        AccountsListViewModel(
            accountRepository: accountRepository,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings,
            clientId: clientId,
            onAppSettingsChanged: onAppSettingsChanged)
    }

    func makeAccountDetailViewModel(account: Account) -> AccountDetailViewModel {
        AccountDetailViewModel(
            accountRepository: accountRepository,
            accountOperationsWebSocket: makeAccountOperationsWebSocket(),
            account: account)
    }

    func makeDepositViewModel(account: Account) -> DepositViewModel {
        DepositViewModel(accountRepository: accountRepository, account: account)
    }

    func makeWithdrawViewModel(account: Account) -> WithdrawViewModel {
        WithdrawViewModel(accountRepository: accountRepository, account: account)
    }

    func makeStandaloneTransferViewModel(clientId: String, prefillStore: TransferPrefillStore) -> StandaloneTransferViewModel {
        StandaloneTransferViewModel(
            accountRepository: accountRepository,
            clientId: clientId,
            prefillStore: prefillStore)
    }

    func makeOperationHistoryViewModel(account: Account) -> OperationHistoryViewModel {
        OperationHistoryViewModel(
            accountRepository: accountRepository,
            accountOperationsWebSocket: makeAccountOperationsWebSocket(),
            account: account)
    }

    func makeOpenAccountViewModel(clientId: String) -> OpenAccountViewModel {
        OpenAccountViewModel(accountRepository: accountRepository, clientId: clientId)
    }

    func makeCloseAccountViewModel(account: Account) -> CloseAccountViewModel {
        CloseAccountViewModel(accountRepository: accountRepository, account: account)
    }

    func makeCreditsListViewModel(clientId: String) -> CreditsListViewModel {
        CreditsListViewModel(creditRepository: creditRepository, clientId: clientId)
    }

    func makeTakeCreditViewModel(clientId: String) -> TakeCreditViewModel {
        TakeCreditViewModel(
            creditRepository: creditRepository,
            accountRepository: accountRepository,
            clientId: clientId)
    }

    func makeRepayCreditViewModel(credit: Credit) -> RepayCreditViewModel {
        RepayCreditViewModel(
            creditRepository: creditRepository,
            accountRepository: accountRepository,
            credit: credit)
    }

    func makeCreditDetailViewModel(credit: Credit, clientId _: String) -> CreditDetailViewModel {
        CreditDetailViewModel(
            creditRepository: creditRepository,
            accountRepository: accountRepository,
            credit: credit)
    }

    func makeProfileViewModel(onAppSettingsChanged: @escaping () -> Void) -> ProfileViewModel {
        ProfileViewModel(
            authRepository: authRepository,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings,
            onAppSettingsChanged: onAppSettingsChanged)
    }
}
