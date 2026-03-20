import Foundation

final class MockStorage {
    var accounts: [Account] = []
    var operations: [AccountOperation] = []
    var credits: [Credit] = []
    var tariffs: [CreditTariff] = []
    private let lock = NSLock()

    func withLock<T>(_ block: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return block()
    }

    static func makeInitialData() -> MockStorage {
        let storage = MockStorage()
        storage.withLock {
            storage.tariffs = [
                CreditTariff(id: "tariff-1", name: "Стандарт", rate: 12, minAmount: nil, maxAmount: nil),
                CreditTariff(id: "tariff-2", name: "Выгодный", rate: 9.5, minAmount: nil, maxAmount: nil),
                CreditTariff(id: "tariff-3", name: "Премиум", rate: 7, minAmount: nil, maxAmount: nil),
            ]
        }
        return storage
    }
}
