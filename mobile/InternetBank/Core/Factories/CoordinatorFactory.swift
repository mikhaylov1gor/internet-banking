import SwiftUI

final class CoordinatorFactory: CoordinatorFactoryProtocol {
    private let viewFactory: ViewFactoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings
    private let accountRepository: AccountRepositoryProtocol

    init(
        viewFactory: ViewFactoryProtocol,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings,
        accountRepository: AccountRepositoryProtocol)
    {
        self.viewFactory = viewFactory
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
        self.accountRepository = accountRepository
    }

    func makeAuthCoordinator() -> AuthCoordinator {
        AuthCoordinator(viewFactory: viewFactory)
    }

    func makeMainCoordinator(clientId: String) -> MainCoordinator {
        MainCoordinator(
            viewFactory: viewFactory,
            accountRepository: accountRepository,
            clientId: clientId,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings)
    }
}
