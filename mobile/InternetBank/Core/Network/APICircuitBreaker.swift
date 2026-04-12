import Foundation

struct APICircuitBreakerConfiguration: Sendable {
    var failureThreshold: Int
    var openDuration: TimeInterval

    static let `default` = APICircuitBreakerConfiguration(
        failureThreshold: 5,
        openDuration: 30)
}

protocol APICircuitBreaker: Sendable {
    func beforeRequest() async throws
    func recordSuccess() async
    func recordFailure() async
}

actor DefaultAPICircuitBreaker: APICircuitBreaker {
    private enum State {
        case closed
        case open(until: Date)
        case halfOpen
    }

    private var state: State = .closed
    private var consecutiveTripFailures = 0
    private let failureThreshold: Int
    private let openDuration: TimeInterval

    init(configuration: APICircuitBreakerConfiguration = .default) {
        failureThreshold = max(1, configuration.failureThreshold)
        openDuration = max(1, configuration.openDuration)
    }

    func beforeRequest() async throws {
        let now = Date()
        switch state {
        case .closed:
            return
        case let .open(until):
            if now < until {
                throw APIError.circuitOpen(retryAfter: until.timeIntervalSince(now))
            }
            state = .halfOpen
            consecutiveTripFailures = 0
        case .halfOpen:
            return
        }
    }

    func recordSuccess() async {
        consecutiveTripFailures = 0
        state = .closed
    }

    func recordFailure() async {
        consecutiveTripFailures += 1
        switch state {
        case .closed:
            if consecutiveTripFailures >= failureThreshold {
                state = .open(until: Date().addingTimeInterval(openDuration))
            }
        case .halfOpen:
            state = .open(until: Date().addingTimeInterval(openDuration))
            consecutiveTripFailures = failureThreshold
        case .open:
            break
        }
    }
}
