import Foundation

final class DependenciesAssembly {
    static let shared = DependenciesAssembly()

    private(set) lazy var keychainStorage = KeychainStorage()
    private(set) lazy var userDefaultsStorage = UserDefaultsStorage()
    private(set) lazy var authService: AuthServiceProtocol = AuthService(keychain: keychainStorage)

    private lazy var gatewayURL: URL = {
        guard let url = URL(string: Config.apiGatewayURL) else {
            fatalError("Invalid API Gateway URL")
        }
        return url
    }()

    private(set) lazy var sessionState = SessionState()

    private(set) lazy var tokenHandler: JWTTokenHandlerProtocol = JWTTokenHandler(
        authService: authService,
        sessionState: sessionState,
        baseURL: gatewayURL)

    private lazy var apiRetryPolicy: APIRetryPolicy = DefaultAPIRetryPolicy()

    private lazy var apiCircuitBreaker: any APICircuitBreaker = DefaultAPICircuitBreaker()

    private(set) lazy var apiClient = APIClient(
        baseURL: gatewayURL,
        session: URLSession.shared,
        tokenHandler: tokenHandler,
        retryConfiguration: .default,
        retryPolicy: apiRetryPolicy,
        circuitBreaker: apiCircuitBreaker)

    private init() {}
}
