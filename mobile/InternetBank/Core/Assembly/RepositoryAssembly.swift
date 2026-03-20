import Foundation

final class RepositoryAssembly {
    private let dependencies: DependenciesAssembly

    private lazy var mockStorage = MockStorage.makeInitialData()

    init(dependencies: DependenciesAssembly = .shared) {
        self.dependencies = dependencies
    }

    var accountRepository: AccountRepositoryProtocol {
        if Config.useMocks {
            return MockAccountRepository(storage: mockStorage)
        }
        return AccountRepository(apiClient: dependencies.apiClient)
    }

    var creditRepository: CreditRepositoryProtocol {
        if Config.useMocks {
            return MockCreditRepository(storage: mockStorage)
        }
        return CreditRepository(apiClient: dependencies.apiClient)
    }

    var authRepository: AuthRepositoryProtocol {
        if Config.useMocks {
            return MockAuthRepository(authService: dependencies.authService)
        }
        return AuthRepository(
            apiClient: dependencies.apiClient,
            authService: dependencies.authService,
            tokenHandler: dependencies.tokenHandler)
    }
}
