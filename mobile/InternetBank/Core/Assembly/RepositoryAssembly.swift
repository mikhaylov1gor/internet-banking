import Foundation

final class RepositoryAssembly {
    private let dependencies: DependenciesAssembly

    private lazy var mockStorage: MockStorage = MockStorage.makeInitialData()

    init(dependencies: DependenciesAssembly = .shared) {
        self.dependencies = dependencies
    }

    var accountRepository: AccountRepositoryProtocol {
        if Config.useMocks {
            return MockAccountRepository(storage: mockStorage)
        }
        return AccountRepository(coreAPI: dependencies.coreAPIClient)
    }

    var creditRepository: CreditRepositoryProtocol {
        if Config.useMocks {
            return MockCreditRepository(storage: mockStorage)
        }
        return CreditRepository(creditsAPI: dependencies.creditsAPIClient)
    }

    var authRepository: AuthRepositoryProtocol {
        if Config.useMocks {
            return MockAuthRepository(authService: dependencies.authService)
        }
        return AuthRepository(authAPI: dependencies.authAPIClient, authService: dependencies.authService)
    }
}
