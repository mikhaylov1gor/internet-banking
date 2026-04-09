import Foundation

protocol AuthServiceProtocol: AnyObject {
    func saveToken(_ token: String)
    func getToken() -> String?
    func clearToken()
    func saveRefreshToken(_ token: String)
    func getRefreshToken() -> String?
    func clearRefreshToken()
    func saveUserId(_ userId: String)
    func getUserId() -> String?
    func clearUserId()
}

protocol AccountOperationsWebSocketProtocol: AnyObject {
    func connect(
        accountId: String,
        onOperationCreated: @escaping () -> Void,
        onError: @escaping (String) -> Void)
    func disconnect()
}
