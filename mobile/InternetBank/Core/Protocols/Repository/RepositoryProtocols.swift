import Foundation

protocol AuthRepositoryProtocol: AnyObject {
    func login(email: String, password: String) async throws -> AuthResult
    func logout()
    var currentUserId: String? { get }
    var isAuthenticated: Bool { get }
}
