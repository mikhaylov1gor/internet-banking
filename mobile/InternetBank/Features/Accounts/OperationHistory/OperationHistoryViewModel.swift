import Foundation

@Observable
@MainActor
final class OperationHistoryViewModel {
    var operations: [AccountOperation] = []
    var isLoading = false
    var errorMessage: String?

    private let accountRepository: AccountRepositoryProtocol
    private let accountOperationsWebSocket: AccountOperationsWebSocketProtocol
    private let account: Account

    private var backupPollTask: Task<Void, Never>?

    var currencySymbol: String {
        account.currencySymbol
    }

    init(
        accountRepository: AccountRepositoryProtocol,
        accountOperationsWebSocket: AccountOperationsWebSocketProtocol,
        account: Account)
    {
        self.accountRepository = accountRepository
        self.accountOperationsWebSocket = accountOperationsWebSocket
        self.account = account
    }

    func load() async {
        isLoading = true
        do {
            operations = try await accountRepository.getOperations(accountId: account.id)
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func startRealtimeUpdates() {
        accountOperationsWebSocket.disconnect()
        backupPollTask?.cancel()
        backupPollTask = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 10_000_000_000)
                guard !Task.isCancelled else { break }
                await self?.refreshOperationsFromAPI()
            }
        }
        accountOperationsWebSocket.connect(
            accountId: account.id,
            onOperationCreated: { [weak self] in
                Task { @MainActor [weak self] in
                    await self?.refreshOperationsFromAPI()
                }
            },
            onError: { [weak self] message in
                Task { @MainActor in
                    self?.errorMessage = message
                }
            })
    }

    private func refreshOperationsFromAPI() async {
        do {
            operations = try await accountRepository.getOperations(accountId: account.id)
            errorMessage = nil
        } catch {
            errorMessage = error.displayMessage
        }
    }

    func stopRealtimeUpdates() {
        backupPollTask?.cancel()
        backupPollTask = nil
        accountOperationsWebSocket.disconnect()
    }
}
