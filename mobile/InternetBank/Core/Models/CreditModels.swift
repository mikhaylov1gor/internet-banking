import Foundation

struct CreditResponse: Decodable {
    let id: String
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: String
    let remainingAmount: String
    let startDate: String
    let tariffName: String
    let tariffRate: String
}

struct TariffResponse: Decodable {
    let id: String
    let name: String
    let rate: String
}

struct TakeCreditRequest: Encodable {
    let clientId: String
    let accountId: String
    let tariffId: String
    let amount: Decimal
}

struct RepayRequest: Encodable {
    let amount: Decimal
}

struct CreditsListResponse: Decodable {
    let credits: [CreditResponse]
}

struct TariffsListResponse: Decodable {
    let tariffs: [TariffResponse]
}
