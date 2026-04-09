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
    let termDays: Int?
    let termMonths: Int?
}

struct RepayCreditRequest: Encodable {
    let amount: Double
    let accountId: String
}

struct CreditOverdueDTO: Decodable {
    let creditId: String
    let clientId: String
    let expectedPaid: Double
    let actualPaid: Double
    let overdueAmount: Double
    let overduePayments: Int
    let minutePayment: Double
}

struct CreditRatingDTO: Decodable {
    let clientId: String
    let score: Int
    let riskLevel: String
    let overdueAmount: Double
    let overdueCount: Int
}

struct CreditPaymentItemDTO: Decodable {
    let day: Int?
    let index: Int
    let dueAt: String
    let amountDue: Double?
    let amountPaid: Double?
    let amountRemaining: Double?
    let expectedTotal: Double
    let paidNowTotal: Double
    let status: String
}

struct CreditPaymentListResponse: Decodable {
    let items: [CreditPaymentItemDTO]
    let pageNumber: Int
    let pageQuantity: Int
}

struct CreditPaymentListResult: Sendable {
    let items: [CreditScheduledPayment]
    let pageNumber: Int
    let pageQuantity: Int
}
