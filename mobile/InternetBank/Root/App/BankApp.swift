import SwiftUI

@main
struct BankApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    private let repositoryAssembly: RepositoryAssembly
    private let factoryAssembly: FactoryAssembly

    init() {
        let repo = RepositoryAssembly()
        repositoryAssembly = repo
        factoryAssembly = FactoryAssembly(repositoryAssembly: repo)
    }

    var body: some Scene {
        WindowGroup {
            AppCoordinator(
                coordinatorFactory: factoryAssembly.coordinatorFactory,
                authRepository: repositoryAssembly.authRepository,
                sessionState: DependenciesAssembly.shared.sessionState).start()
        }
    }
}
