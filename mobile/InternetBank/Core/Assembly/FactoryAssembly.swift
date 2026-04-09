import Foundation

final class FactoryAssembly {
    private let repositoryAssembly: RepositoryAssembly

    init(repositoryAssembly: RepositoryAssembly = RepositoryAssembly()) {
        self.repositoryAssembly = repositoryAssembly
    }

    var viewModelFactory: ViewModelFactoryProtocol {
        ViewModelFactory(
            accountRepository: repositoryAssembly.accountRepository,
            creditRepository: repositoryAssembly.creditRepository,
            authRepository: repositoryAssembly.authRepository,
            appSettingsRepository: repositoryAssembly.appSettingsRepository,
            clientAppSettings: repositoryAssembly.clientAppSettings,
            makeAccountOperationsWebSocket: { self.repositoryAssembly.accountOperationsWebSocket })
    }

    var viewFactory: ViewFactoryProtocol {
        ViewFactory(viewModelFactory: viewModelFactory, authRepository: repositoryAssembly.authRepository)
    }

    var coordinatorFactory: CoordinatorFactoryProtocol {
        CoordinatorFactory(
            viewFactory: viewFactory,
            appSettingsRepository: repositoryAssembly.appSettingsRepository,
            clientAppSettings: repositoryAssembly.clientAppSettings,
            accountRepository: repositoryAssembly.accountRepository)
    }
}
