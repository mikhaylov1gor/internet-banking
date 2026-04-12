import Foundation

struct APIRetryConfiguration: Sendable {
    var baseDelay: TimeInterval
    var maxDelay: TimeInterval
    var multiplier: Double

    static let `default` = APIRetryConfiguration(
        baseDelay: 1,
        maxDelay: 32,
        multiplier: 2)
}

protocol APIRetryPolicy: Sendable {
    func shouldRetryTransportError(_ error: Error) -> Bool
    func shouldRetryHTTPStatus(_ statusCode: Int) -> Bool
    func backoffNanoseconds(attemptIndex: Int, configuration: APIRetryConfiguration) -> UInt64
}

struct DefaultAPIRetryPolicy: APIRetryPolicy {
    func shouldRetryTransportError(_ error: Error) -> Bool {
        guard let urlError = error as? URLError else { return false }
        switch urlError.code {
        case .timedOut,
             .networkConnectionLost,
             .notConnectedToInternet,
             .cannotConnectToHost,
             .cannotFindHost,
             .dnsLookupFailed,
             .internationalRoamingOff,
             .callIsActive,
             .dataNotAllowed:
            return true
        default:
            return false
        }
    }

    func shouldRetryHTTPStatus(_ statusCode: Int) -> Bool {
        switch statusCode {
        case 408, 429, 502, 503, 504:
            return true
        default:
            return false
        }
    }

    func backoffNanoseconds(attemptIndex: Int, configuration: APIRetryConfiguration) -> UInt64 {
        let exponent = pow(configuration.multiplier, Double(attemptIndex))
        let ceiling = min(configuration.maxDelay, configuration.baseDelay * exponent)
        let upper = max(0, ceiling)
        let seconds = upper == 0 ? 0 : Double.random(in: 0 ... upper)
        let clamped = min(seconds, Double(UInt64.max) / 1_000_000_000)
        return UInt64(clamped * 1_000_000_000)
    }
}
