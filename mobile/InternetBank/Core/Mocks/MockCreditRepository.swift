import Foundation

final class MockCreditRepository: CreditRepositoryProtocol {
    private let storage: MockStorage

    init(storage: MockStorage) {
        self.storage = storage
    }

    func getCredits(clientId: String) async throws -> [Credit] {
        try await Task.sleep(nanoseconds: 300_000_000)
        return storage.withLock {
            storage.credits.filter { $0.clientId == clientId }
        }
    }

    func getCredit(id: String) async throws -> Credit? {
        try await Task.sleep(nanoseconds: 100_000_000)
        return storage.withLock {
            storage.credits.first { $0.id == id }
        }
    }

    func getTariffs() async throws -> [CreditTariff] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return storage.withLock { storage.tariffs }
    }

    func takeCredit(clientId: String, accountId: String, tariffId: String, amount: Decimal) async throws -> Credit {
        try await Task.sleep(nanoseconds: 300_000_000)
        guard let result = storage.withLock({
            guard let tariff = storage.tariffs.first(where: { $0.id == tariffId }),
                  let accIdx = storage.accounts.firstIndex(where: { $0.id == accountId }) else {
                return nil as Credit?
            }
            let id = "credit-\(UUID().uuidString.prefix(8))"
            let credit = Credit(
                id: id,
                clientId: clientId,
                accountId: accountId,
                tariffId: tariffId,
                amount: amount,
                remainingAmount: amount,
                startDate: Date(),
                tariffName: tariff.name,
                tariffRate: tariff.rate
            )
            storage.credits.append(credit)
            storage.accounts[accIdx].balance += amount
            let op = AccountOperation(
                id: "op-\(UUID().uuidString.prefix(8))",
                accountId: accountId,
                type: .creditReceipt,
                amount: amount,
                date: Date()
            )
            storage.operations.append(op)
            return credit
        }) else {
            throw MockError.invalidTariffOrAccount
        }
        return result
    }

    func repayCredit(creditId: String, amount: Decimal) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        storage.withLock {
            guard let i = storage.credits.firstIndex(where: { $0.id == creditId }),
                  let accIdx = storage.accounts.firstIndex(where: { $0.id == storage.credits[i].accountId }) else {
                return
            }
            let repayAmount = min(amount, storage.credits[i].remainingAmount)
            storage.credits[i].remainingAmount -= repayAmount
            storage.accounts[accIdx].balance -= repayAmount
            let op = AccountOperation(
                id: "op-\(UUID().uuidString.prefix(8))",
                accountId: storage.credits[i].accountId,
                type: .creditPayment,
                amount: repayAmount,
                date: Date()
            )
            storage.operations.append(op)
            if storage.credits[i].remainingAmount <= 0 {
                storage.credits.remove(at: i)
            }
        }
    }
}
