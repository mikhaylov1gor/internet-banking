import Foundation

struct CreditListResponse: Decodable {
    let credits: [CreditResponse]
    let pageNumber: Int
    let pageQuantity: Int
}

struct CreditResponse: Decodable {
    let id: String
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: Double
    let remaining: Double?
    let rate: Double?
    let dailyPayment: Double?
    let issuedAt: String?
    let status: String?
}

struct TariffListResponse: Decodable {
    let tariffs: [TariffResponse]
    let pageNumber: Int
    let pageQuantity: Int
}

struct TariffResponse: Decodable {
    let id: String
    let name: String
    let rate: Double
    let minAmount: Double?
    let maxAmount: Double?
}

struct IssueCreditRequest: Encodable {
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: Double
}

struct RepayCreditRequest: Encodable {
    let amount: Double
    let accountId: String
}
