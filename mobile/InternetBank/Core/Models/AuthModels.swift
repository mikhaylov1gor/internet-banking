import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginResponse: Decodable {
    let token: String
    let refreshToken: String?
    let userId: String
    let type: String
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String
}
