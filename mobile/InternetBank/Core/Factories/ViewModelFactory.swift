import Foundation

final class ViewModelFactory: ViewModelFactoryProtocol {
    private let accountRepository: AccountRepositoryProtocol
    private let creditRepository: CreditRepositoryProtocol
    private let authRepository: AuthRepositoryProtocol

    init(
        accountRepository: AccountRepositoryProtocol,
        creditRepository: CreditRepositoryProtocol,
        authRepository: AuthRepositoryProtocol
    ) {
        self.accountRepository = accountRepository
        self.creditRepository = creditRepository
        self.authRepository = authRepository
    }

    func makeLoginViewModel() -> LoginViewModel {
        LoginViewModel(authRepository: authRepository)
    }

    func makeAccountsListViewModel(clientId: String) -> AccountsListViewModel {
        AccountsListViewModel(accountRepository: accountRepository, clientId: clientId)
    }

    func makeAccountDetailViewModel(account: Account) -> AccountDetailViewModel {
        AccountDetailViewModel(accountRepository: accountRepository, account: account)
    }

    func makeDepositViewModel(account: Account) -> DepositViewModel {
        DepositViewModel(accountRepository: accountRepository, account: account)
    }

    func makeWithdrawViewModel(account: Account) -> WithdrawViewModel {
        WithdrawViewModel(accountRepository: accountRepository, account: account)
    }

    func makeOperationHistoryViewModel(account: Account) -> OperationHistoryViewModel {
        OperationHistoryViewModel(accountRepository: accountRepository, account: account)
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
            clientId: clientId
        )
    }

    func makeRepayCreditViewModel(credit: Credit) -> RepayCreditViewModel {
        RepayCreditViewModel(creditRepository: creditRepository, credit: credit)
    }

    func makeProfileViewModel(clientId: String) -> ProfileViewModel {
        ProfileViewModel(authRepository: authRepository, clientId: clientId)
    }
}
