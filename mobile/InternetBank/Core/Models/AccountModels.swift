import Foundation

struct AccountResponse: Decodable {
    let id: String
    let clientId: String
    let balance: String
    let createdAt: String
}

struct OperationResponse: Decodable {
    let id: String
    let accountId: String
    let type: String
    let amount: String
    let date: String
}

struct DepositRequest: Encodable {
    let amount: Decimal
}

struct AccountsListResponse: Decodable {
    let accounts: [AccountResponse]
}

struct OperationsListResponse: Decodable {
    let operations: [OperationResponse]
}
