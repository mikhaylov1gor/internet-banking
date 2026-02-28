import Foundation

struct LoginRequest: Encodable {
    let login: String
    let password: String
}

struct LoginResponse: Decodable {
    let userId: String
    let token: String
}
