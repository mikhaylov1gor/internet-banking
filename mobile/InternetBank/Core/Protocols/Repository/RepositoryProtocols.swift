import Foundation

protocol AuthRepositoryProtocol: AnyObject {
    func login(email: String, password: String) async throws -> AuthResult
    func completeWebAuth(accessToken: String, refreshToken: String, userId: String)
    func logout()
    var currentUserId: String? { get }
    var isAuthenticated: Bool { get }
}
