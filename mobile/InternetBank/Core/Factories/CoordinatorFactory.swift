import SwiftUI

final class CoordinatorFactory: CoordinatorFactoryProtocol {
    private let viewFactory: ViewFactoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings

    init(
        viewFactory: ViewFactoryProtocol,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings)
    {
        self.viewFactory = viewFactory
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
    }

    func makeAuthCoordinator() -> AuthCoordinator {
        AuthCoordinator(viewFactory: viewFactory)
    }

    func makeMainCoordinator(clientId: String) -> MainCoordinator {
        MainCoordinator(
            viewFactory: viewFactory,
            clientId: clientId,
            appSettingsRepository: appSettingsRepository,
            clientAppSettings: clientAppSettings)
    }
}
