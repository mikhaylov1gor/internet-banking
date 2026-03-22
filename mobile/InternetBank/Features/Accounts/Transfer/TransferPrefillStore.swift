import Foundation

@Observable
final class TransferPrefillStore {
    private(set) var revision = 0
    private(set) var fromAccountId: String?
    private(set) var toAccountId: String?

    func request(from: String?, to: String?) {
        fromAccountId = from
        toAccountId = to
        revision += 1
    }
}
