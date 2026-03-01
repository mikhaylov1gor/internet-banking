import Foundation

struct AccountResponse: Decodable {
    let id: String
    let clientId: String
    let balance: Double
    let currency: String?
    let status: String
    let openedAt: String
    let closedAt: String?
}

struct OperationResponse: Decodable {
    let id: String
    let accountId: String
    let type: String
    let amount: Double
    let balanceAfter: Double?
    let createdAt: String
    let description: String?
    let creditId: String?
}

struct OpenAccountRequest: Encodable {
    let clientId: String
}

struct ChangeBalanceRequest: Encodable {
    let amount: Double
}
