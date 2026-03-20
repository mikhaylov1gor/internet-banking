import Foundation

final class AuthService: AuthServiceProtocol {
    private let keychain: KeychainStorage

    private enum Keys {
        static let token = "auth_token"
        static let refreshToken = "auth_refresh_token"
        static let userId = "auth_user_id"
    }

    init(keychain: KeychainStorage) {
        self.keychain = keychain
    }

    func saveToken(_ token: String) {
        keychain.save(key: Keys.token, value: token)
    }

    func getToken() -> String? {
        keychain.get(key: Keys.token)
    }

    func clearToken() {
        keychain.delete(key: Keys.token)
    }

    func saveRefreshToken(_ token: String) {
        keychain.save(key: Keys.refreshToken, value: token)
    }

    func getRefreshToken() -> String? {
        keychain.get(key: Keys.refreshToken)
    }

    func clearRefreshToken() {
        keychain.delete(key: Keys.refreshToken)
    }

    func saveUserId(_ userId: String) {
        keychain.save(key: Keys.userId, value: userId)
    }

    func getUserId() -> String? {
        let id = keychain.get(key: Keys.userId)
        return id?.isEmpty == false ? id : nil
    }

    func clearUserId() {
        keychain.delete(key: Keys.userId)
    }
}
