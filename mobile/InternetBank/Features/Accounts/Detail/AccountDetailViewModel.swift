import Foundation

@Observable
@MainActor
final class AccountDetailViewModel {
    var account: Account
    var isLoading = false
    var errorMessage: String?

    private let accountRepository: AccountRepositoryProtocol
    private let accountOperationsWebSocket: AccountOperationsWebSocketProtocol
    private var backupPollTask: Task<Void, Never>?

    init(
        accountRepository: AccountRepositoryProtocol,
        accountOperationsWebSocket: AccountOperationsWebSocketProtocol,
        account: Account)
    {
        self.accountRepository = accountRepository
        self.accountOperationsWebSocket = accountOperationsWebSocket
        self.account = account
    }

    func refresh() async {
        isLoading = true
        await refreshFromAPI()
        isLoading = false
    }

    func startRealtimeUpdates() {
        accountOperationsWebSocket.disconnect()
        backupPollTask?.cancel()
        backupPollTask = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000)
                guard !Task.isCancelled else { break }
                await self?.refreshFromAPI()
            }
        }
        accountOperationsWebSocket.connect(
            accountId: account.id,
            onOperationCreated: { [weak self] in
                Task { @MainActor [weak self] in
                    await self?.refreshFromAPI()
                }
            },
            onError: { [weak self] message in
                Task { @MainActor in
                    self?.errorMessage = message
                }
            })
    }

    func stopRealtimeUpdates() {
        backupPollTask?.cancel()
        backupPollTask = nil
        accountOperationsWebSocket.disconnect()
    }

    private func refreshFromAPI() async {
        do {
            if let updated = try await accountRepository.getAccount(id: account.id) {
                account = updated
            }
            errorMessage = nil
        } catch {
            errorMessage = error.displayMessage
        }
    }
}
