import Foundation

final class AccountOperationsWebSocketService: AccountOperationsWebSocketProtocol {
    private let baseURL: URL
    private let tokenHandler: TokenHandlerProtocol
    private let pageSize: Int

    private var coordinatorTask: Task<Void, Never>?
    private var intentionalDisconnect = false
    private var failureCountBeforeReconnect = 0

    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession?
    private var pingTask: Task<Void, Never>?

    private static let maxReconnectAttempts = 5
    private static let baseReconnectNanoseconds: UInt64 = 1_000_000_000

    init(baseURL: URL, tokenHandler: TokenHandlerProtocol, pageSize: Int = 50) {
        self.baseURL = baseURL
        self.tokenHandler = tokenHandler
        self.pageSize = pageSize
    }

    func connect(
        accountId: String,
        onOperationCreated: @escaping () -> Void,
        onError: @escaping (String) -> Void)
    {
        disconnect()
        intentionalDisconnect = false
        failureCountBeforeReconnect = 0
        coordinatorTask = Task { [weak self] in
            await self?.runCoordinator(
                accountId: accountId,
                onOperationCreated: onOperationCreated,
                onError: onError)
        }
    }

    func disconnect() {
        intentionalDisconnect = true
        stopSessionTransport()
        coordinatorTask?.cancel()
        coordinatorTask = nil
    }

    private func stopSessionTransport() {
        pingTask?.cancel()
        pingTask = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        urlSession?.invalidateAndCancel()
        urlSession = nil
    }

    private func runCoordinator(
        accountId: String,
        onOperationCreated: @escaping () -> Void,
        onError: @escaping (String) -> Void) async
    {
        while !Task.isCancelled && !intentionalDisconnect {
            let shouldApplyBackoff = await runOneConnection(
                accountId: accountId,
                onOperationCreated: onOperationCreated,
                onError: onError)
            if Task.isCancelled || intentionalDisconnect { break }
            if !shouldApplyBackoff { break }
            failureCountBeforeReconnect += 1
            if failureCountBeforeReconnect >= Self.maxReconnectAttempts {
                await MainActor.run {
                    onError("Не удалось поддерживать соединение в реальном времени")
                }
                break
            }
            let shift = min(failureCountBeforeReconnect - 1, 4)
            let delay = Self.baseReconnectNanoseconds * UInt64(1 << shift)
            try? await Task.sleep(nanoseconds: delay)
        }
    }

    private func runOneConnection(
        accountId: String,
        onOperationCreated: @escaping () -> Void,
        onError: @escaping (String) -> Void) async -> Bool
    {
        if intentionalDisconnect || Task.isCancelled { return false }
        let raw = tokenHandler.getAccessToken() ?? ""
        let token = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !token.isEmpty else {
            await MainActor.run { onError("Требуется авторизация") }
            return false
        }
        guard let url = Self.makeWebSocketURL(baseURL: baseURL, accountId: accountId, pageSize: pageSize) else {
            await MainActor.run { onError("Некорректный адрес WebSocket") }
            return false
        }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let session = URLSession(configuration: .default)
        urlSession = session
        let task = session.webSocketTask(with: request)
        webSocketTask = task
        task.resume()
        pingTask = Task { [weak self] in
            await self?.pingLoop()
        }
        defer {
            stopSessionTransport()
        }
        var receivedFirstFrame = false
        while !Task.isCancelled && !intentionalDisconnect {
            guard let ws = webSocketTask else { break }
            do {
                let message = try await ws.receive()
                if !receivedFirstFrame {
                    receivedFirstFrame = true
                    failureCountBeforeReconnect = 0
                }
                switch message {
                    case .string(let text):
                        if let data = text.data(using: .utf8) {
                            handlePayload(
                                data: data,
                                onOperationCreated: onOperationCreated,
                                onError: onError)
                        }
                    case .data(let data):
                        handlePayload(
                            data: data,
                            onOperationCreated: onOperationCreated,
                            onError: onError)
                    @unknown default:
                        break
                }
            } catch {
                break
            }
        }
        if intentionalDisconnect || Task.isCancelled { return false }
        return true
    }

    private func handlePayload(
        data: Data,
        onOperationCreated: @escaping () -> Void,
        onError: @escaping (String) -> Void)
    {
        guard let parsed = Self.parseEnvelope(data) else { return }
        switch parsed.type {
            case "operations_snapshot":
                break
            case "operation_created":
                Task { @MainActor in
                    onOperationCreated()
                }
            case "error":
                Task { @MainActor in
                    onError(parsed.error ?? "Ошибка сервера")
                }
            default:
                break
        }
    }

    private static func parseEnvelope(_ data: Data) -> (type: String, error: String?)? {
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let type = obj["type"] as? String
        else {
            return nil
        }
        let err = obj["error"] as? String
        return (type, err)
    }

    private func pingLoop() async {
        while !Task.isCancelled {
            try? await Task.sleep(nanoseconds: 25_000_000_000)
            guard !Task.isCancelled, let task = webSocketTask else { break }
            task.sendPing { _ in }
        }
    }

    private static func makeWebSocketURL(baseURL: URL, accountId: String, pageSize: Int) -> URL? {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        components.scheme = (components.scheme?.lowercased() == "https") ? "wss" : "ws"
        components.path = "/ws/accounts/\(accountId)/operations"
        components.queryItems = [
            URLQueryItem(name: "page_size", value: String(pageSize)),
        ]
        components.fragment = nil
        return components.url
    }
}
