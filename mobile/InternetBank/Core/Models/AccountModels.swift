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
    let accountNumber: String?
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
    let amount: Double
    let toAccountId: String?
    let toAccountNumber: String?

    enum CodingKeys: String, CodingKey {
        case fromAccountId = "from_account_id"
        case toAccountId = "to_account_id"
        case toAccountNumber = "to_account_number"
        case amount
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(fromAccountId, forKey: .fromAccountId)
        try c.encode(amount, forKey: .amount)
        try c.encodeIfPresent(toAccountId, forKey: .toAccountId)
        try c.encodeIfPresent(toAccountNumber, forKey: .toAccountNumber)
    }
}

struct TransferAPIResponse: Decodable {
    let debitOperation: OperationResponse?
    let creditOperation: OperationResponse?
}

struct ChangeBalanceRequest: Encodable {
    let amount: Double
}
