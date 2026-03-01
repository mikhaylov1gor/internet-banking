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

    private(set) lazy var apiClient: APIClient = {
        let client = APIClient(baseURL: gatewayURL)
        if let token = authService.getToken() {
            client.setAuthToken(token)
        }
        return client
    }()

    private init() {}
}
