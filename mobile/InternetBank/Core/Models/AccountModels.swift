import Foundation

struct AccountListResponse: Decodable {
    let accounts: [AccountResponse]
    let pageNumber: Int
    let pageQuantity: Int
}

struct AccountResponse: Decodable {
    let id: String
    let clientId: String
    let balance: Double
    let currency: String?
    let status: String
    let openedAt: String
    let closedAt: String?
}

struct OperationListResponse: Decodable {
    let operations: [OperationResponse]
    let pageNumber: Int
    let pageQuantity: Int
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
    let currency: String
}

struct TransferRequest: Encodable {
    let fromAccountId: String
    let toAccountId: String
    let amount: Double
}

struct TransferAPIResponse: Decodable {
    let debitOperation: OperationResponse?
    let creditOperation: OperationResponse?
}

struct ChangeBalanceRequest: Encodable {
    let amount: Double
}
