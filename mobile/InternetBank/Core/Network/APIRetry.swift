import Foundation

struct APIRetryConfiguration: Sendable {
    var maxAttempts: Int
    var baseDelay: TimeInterval
    var maxDelay: TimeInterval
    var multiplier: Double

    static let `default` = APIRetryConfiguration(
        maxAttempts: 3,
        baseDelay: 0.35,
        maxDelay: 8,
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
        let exp = pow(configuration.multiplier, Double(attemptIndex))
        let raw = configuration.baseDelay * exp
        let capped = min(configuration.maxDelay, raw)
        let jitter = Double.random(in: 0.85 ... 1.15)
        let seconds = capped * jitter
        let clamped = min(max(0, seconds), Double(UInt64.max) / 1_000_000_000)
        return UInt64(clamped * 1_000_000_000)
    }
}
