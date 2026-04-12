import Foundation

struct APICircuitBreakerConfiguration: Sendable {
    var windowSize: Int
    var minimumSampleCount: Int
    var failureRateToOpen: Double
    var openDuration: TimeInterval

    static let `default` = APICircuitBreakerConfiguration(
        windowSize: 30,
        minimumSampleCount: 10,
        failureRateToOpen: 0.7,
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
    private var outcomes: [Bool] = []
    private let windowSize: Int
    private let minimumSampleCount: Int
    private let failureRateToOpen: Double
    private let openDuration: TimeInterval

    init(configuration: APICircuitBreakerConfiguration = .default) {
        windowSize = max(2, configuration.windowSize)
        minimumSampleCount = max(1, min(configuration.minimumSampleCount, windowSize))
        failureRateToOpen = min(1, max(0, configuration.failureRateToOpen))
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
        case .halfOpen:
            return
        }
    }

    func recordSuccess() async {
        switch state {
        case .halfOpen:
            appendOutcome(true)
            state = .closed
        case .closed:
            appendOutcome(true)
            evaluateFailureRateAndOpenIfNeeded()
        case .open:
            break
        }
    }

    func recordFailure() async {
        switch state {
        case .halfOpen:
            appendOutcome(false)
            state = .open(until: Date().addingTimeInterval(openDuration))
        case .closed:
            appendOutcome(false)
            evaluateFailureRateAndOpenIfNeeded()
        case .open:
            break
        }
    }

    private func appendOutcome(_ success: Bool) {
        outcomes.append(success)
        if outcomes.count > windowSize {
            outcomes.removeFirst(outcomes.count - windowSize)
        }
    }

    private func evaluateFailureRateAndOpenIfNeeded() {
        guard case .closed = state else { return }
        guard outcomes.count >= minimumSampleCount else { return }
        let failures = outcomes.filter { !$0 }.count
        let rate = Double(failures) / Double(outcomes.count)
        if rate >= failureRateToOpen {
            state = .open(until: Date().addingTimeInterval(openDuration))
        }
    }
}
