import Foundation

@Observable
final class SessionState {
    private(set) var didSessionExpire = false

    func markSessionExpired() {
        didSessionExpire = true
    }

    func resetSessionExpired() {
        didSessionExpire = false
    }
}
