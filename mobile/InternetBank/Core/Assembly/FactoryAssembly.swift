import Foundation

final class FactoryAssembly {
    private let repositoryAssembly: RepositoryAssembly
    private let serviceAssembly: ServiceAssembly

    init(
        repositoryAssembly: RepositoryAssembly = RepositoryAssembly(),
        serviceAssembly: ServiceAssembly = ServiceAssembly())
    {
        self.repositoryAssembly = repositoryAssembly
        self.serviceAssembly = serviceAssembly
    }

    var viewModelFactory: ViewModelFactoryProtocol {
        ViewModelFactory(
            accountRepository: repositoryAssembly.accountRepository,
            creditRepository: repositoryAssembly.creditRepository,
            authRepository: repositoryAssembly.authRepository)
    }

    var viewFactory: ViewFactoryProtocol {
        ViewFactory(viewModelFactory: viewModelFactory)
    }

    var coordinatorFactory: CoordinatorFactoryProtocol {
        CoordinatorFactory(viewFactory: viewFactory)
    }
}
