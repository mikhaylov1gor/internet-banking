import Foundation

final class ServiceAssembly {
    private let dependencies: DependenciesAssembly

    init(dependencies: DependenciesAssembly = .shared) {
        self.dependencies = dependencies
    }

    var authService: AuthServiceProtocol {
        dependencies.authService
    }
}
