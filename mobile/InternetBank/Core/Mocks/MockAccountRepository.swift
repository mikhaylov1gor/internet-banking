import Foundation

final class MockAccountRepository: AccountRepositoryProtocol {
    private let storage: MockStorage

    init(storage: MockStorage) {
        self.storage = storage
    }

    func getAccounts(clientId: String) async throws -> [Account] {
        try await Task.sleep(nanoseconds: 300_000_000)
        return storage.withLock {
            storage.accounts.filter { $0.clientId == clientId }
        }
    }

    func getAccount(id: String) async throws -> Account? {
        try await Task.sleep(nanoseconds: 100_000_000)
        return storage.withLock {
            storage.accounts.first { $0.id == id }
        }
    }

    func openAccount(clientId: String) async throws -> Account {
        try await Task.sleep(nanoseconds: 200_000_000)
        return storage.withLock {
            let id = "acc-\(UUID().uuidString.prefix(8))"
            let account = Account(
                id: id,
                clientId: clientId,
                balance: 0,
                createdAt: Date()
            )
            storage.accounts.append(account)
            return account
        }
    }

    func closeAccount(id: String) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        storage.withLock {
            storage.accounts.removeAll { $0.id == id }
        }
    }

    func deposit(accountId: String, amount: Decimal) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        storage.withLock {
            if let i = storage.accounts.firstIndex(where: { $0.id == accountId }) {
                storage.accounts[i].balance += amount
                let op = AccountOperation(
                    id: "op-\(UUID().uuidString.prefix(8))",
                    accountId: accountId,
                    type: .deposit,
                    amount: amount,
                    date: Date()
                )
                storage.operations.append(op)
            }
        }
    }

    func withdraw(accountId: String, amount: Decimal) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        let result: Result<Void, MockError> = storage.withLock {
            guard let i = storage.accounts.firstIndex(where: { $0.id == accountId }) else {
                return .failure(.accountNotFound)
            }
            guard storage.accounts[i].balance >= amount else {
                return .failure(.insufficientFunds)
            }
            storage.accounts[i].balance -= amount
            let op = AccountOperation(
                id: "op-\(UUID().uuidString.prefix(8))",
                accountId: accountId,
                type: .withdraw,
                amount: amount,
                date: Date()
            )
            storage.operations.append(op)
            return .success(())
        }
        if case .failure(let error) = result {
            throw error
        }
    }

    func getOperations(accountId: String) async throws -> [AccountOperation] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return storage.withLock {
            storage.operations
                .filter { $0.accountId == accountId }
                .sorted { $0.date > $1.date }
        }
    }
}

enum MockError: Error {
    case accountNotFound
    case insufficientFunds
    case invalidTariffOrAccount
}
