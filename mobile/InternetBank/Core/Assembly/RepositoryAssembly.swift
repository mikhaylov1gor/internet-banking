import Foundation

final class RepositoryAssembly {
    private let dependencies: DependenciesAssembly

    let clientAppSettings = ClientAppSettings()

    init(dependencies: DependenciesAssembly = .shared) {
        self.dependencies = dependencies
    }

    var accountRepository: AccountRepositoryProtocol {
        AccountRepository(apiClient: dependencies.apiClient)
    }

    var creditRepository: CreditRepositoryProtocol {
        CreditRepository(apiClient: dependencies.apiClient)
    }

    var authRepository: AuthRepositoryProtocol {
        AuthRepository(
            apiClient: dependencies.apiClient,
            authService: dependencies.authService,
            tokenHandler: dependencies.tokenHandler)
    }

    var appSettingsRepository: AppSettingsRepositoryProtocol {
        AppSettingsRepository(apiClient: dependencies.apiClient)
    }

    var accountOperationsWebSocket: AccountOperationsWebSocketProtocol {
        guard let baseURL = URL(string: Config.apiGatewayURL) else {
            fatalError("Invalid API Gateway URL")
        }
        return AccountOperationsWebSocketService(
            baseURL: baseURL,
            tokenHandler: dependencies.tokenHandler)
    }
}
