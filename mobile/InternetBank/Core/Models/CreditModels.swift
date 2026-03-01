import Foundation

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
}
