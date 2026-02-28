import Foundation

protocol AuthServiceProtocol: AnyObject {
    func saveToken(_ token: String)
    func getToken() -> String?
    func clearToken()
    func saveUserId(_ userId: String)
    func getUserId() -> String?
    func clearUserId()
}
