import Foundation

final class DependenciesAssembly {
    static let shared = DependenciesAssembly()

    private(set) lazy var keychainStorage: KeychainStorage = KeychainStorage()
    private(set) lazy var userDefaultsStorage: UserDefaultsStorage = UserDefaultsStorage()
    private(set) lazy var authService: AuthServiceProtocol = AuthService(keychain: keychainStorage)

    private lazy var coreBaseURL: URL = {
        guard let url = URL(string: Config.coreAPIBaseURL) else {
            fatalError("Invalid Core API URL")
        }
        return url
    }()

    private lazy var creditsBaseURL: URL = {
        guard let url = URL(string: Config.creditsAPIBaseURL) else {
            fatalError("Invalid Credits API URL")
        }
        return url
    }()

    private lazy var authBaseURL: URL = {
        guard let url = URL(string: Config.authAPIBaseURL) else {
            fatalError("Invalid Auth API URL")
        }
        return url
    }()

    private(set) lazy var coreAPIClient: APIClient = {
        let client = APIClient(baseURL: coreBaseURL)
        if let token = authService.getToken() {
            client.setAuthToken(token)
        }
        return client
    }()

    private(set) lazy var creditsAPIClient: APIClient = {
        let client = APIClient(baseURL: creditsBaseURL)
        if let token = authService.getToken() {
            client.setAuthToken(token)
        }
        return client
    }()

    private(set) lazy var authAPIClient: APIClient = APIClient(baseURL: authBaseURL)

    private init() {}
}
