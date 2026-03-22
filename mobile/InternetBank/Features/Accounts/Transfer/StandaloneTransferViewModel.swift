import Foundation

enum TransferRecipientMode: String, CaseIterable {
    case own
    case other

    var title: String {
        switch self {
            case .own: return "Мой счёт"
            case .other: return "Чужой счёт"
        }
    }
}

@Observable
@MainActor
final class StandaloneTransferViewModel {
    var accounts: [Account] = []
    var fromAccountId: String = ""
    var toAccountId: String = ""
    var recipientMode: TransferRecipientMode = .own
    var otherAccountIdText: String = ""
    var amount: String = ""
    var isLoading = false
    var isSubmitting = false
    var errorMessage: String?
    var didSucceed = false
    var previewQuote: TransferPreviewQuote?
    var previewError: String?
    var isLoadingPreview = false

    let prefillStore: TransferPrefillStore

    private(set) var lastAppliedPrefillRevision = -1

    var onAccountsChanged: (() -> Void)?

    private let accountRepository: AccountRepositoryProtocol
    private let clientId: String

    private var activeAccounts: [Account] {
        accounts.filter { $0.status == "active" }
    }

    var fromAccount: Account? {
        activeAccounts.first { $0.id == fromAccountId }
    }

    var toCandidates: [Account] {
        activeAccounts.filter { $0.id != fromAccountId }
    }

    var pickableFromAccounts: [Account] {
        activeAccounts
    }

    var toAccount: Account? {
        activeAccounts.first { $0.id == toAccountId }
    }

    var trimmedOtherAccountId: String {
        otherAccountIdText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var otherRecipientValid: Bool {
        let t = trimmedOtherAccountId
        guard !t.isEmpty else { return false }
        if let uuid = UUID(uuidString: t) {
            return uuid.uuidString.lowercased() != fromAccountId.lowercased()
        }
        return true
    }

    var transferPreviewTaskKey: String {
        guard let from = fromAccount else { return "" }
        guard let amt = parsedDebitAmount, amt >= 0.01 else { return "" }
        let destKey: String
        switch recipientMode {
            case .own:
                guard let to = toAccount, from.id != to.id else { return "" }
                destKey = "id:\(to.id.lowercased())"
            case .other:
                guard otherRecipientValid else { return "" }
                let t = trimmedOtherAccountId
                if UUID(uuidString: t) != nil {
                    destKey = "id:\(t.lowercased())"
                } else {
                    destKey = "num:\(t)"
                }
        }
        let amtKey = NSDecimalNumber(decimal: amt).stringValue
        return "\(from.id)|\(destKey)|\(amtKey)"
    }

    private var parsedDebitAmount: Decimal? {
        guard let d = Decimal(string: amount.replacingOccurrences(of: ",", with: ".")),
              d >= 0.01
        else { return nil }
        return d
    }

    var showDifferentCurrencyHint: Bool {
        switch recipientMode {
            case .own:
                guard let f = fromAccount, let t = toAccount, f.id != t.id else { return false }
                return f.currency.uppercased() != t.currency.uppercased()
            case .other:
                return true
        }
    }

    var canSubmit: Bool {
        guard let from = fromAccount else { return false }
        guard let value = Decimal(string: amount.replacingOccurrences(of: ",", with: ".")),
              value >= 0.01, value <= from.balance
        else { return false }
        switch recipientMode {
            case .own:
                guard let to = toAccount, from.id != to.id else { return false }
                return true
            case .other:
                return otherRecipientValid
        }
    }

    init(
        accountRepository: AccountRepositoryProtocol,
        clientId: String,
        prefillStore: TransferPrefillStore)
    {
        self.accountRepository = accountRepository
        self.clientId = clientId
        self.prefillStore = prefillStore
    }

    func loadAccounts() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            accounts = try await accountRepository.getAccounts(clientId: clientId)
            ensureValidPickers()
        } catch {
            errorMessage = error.displayMessage
        }
    }

    func applyPrefillFromStore() {
        guard prefillStore.revision != lastAppliedPrefillRevision else {
            ensureValidPickers()
            return
        }
        lastAppliedPrefillRevision = prefillStore.revision
        let ids = Set(activeAccounts.map(\.id))
        let f = prefillStore.fromAccountId.flatMap { ids.contains($0) ? $0 : nil }
        let t = prefillStore.toAccountId.flatMap { ids.contains($0) ? $0 : nil }
        didSucceed = false
        amount = ""
        errorMessage = nil
        previewQuote = nil
        previewError = nil
        recipientMode = .own
        otherAccountIdText = ""
        if let t, let f, f != t {
            fromAccountId = f
            toAccountId = t
        } else if let t {
            toAccountId = t
            fromAccountId = activeAccounts.first { $0.id != t }?.id ?? ""
        } else if let f {
            fromAccountId = f
            toAccountId = activeAccounts.first { $0.id != f }?.id ?? ""
        } else {
            fromAccountId = activeAccounts.first?.id ?? ""
            let firstFrom = fromAccountId
            toAccountId = activeAccounts.first { $0.id != firstFrom }?.id ?? ""
        }
        ensureValidPickers()
    }

    func resetForNewTransfer() {
        didSucceed = false
        amount = ""
        errorMessage = nil
        previewQuote = nil
        previewError = nil
        lastAppliedPrefillRevision = -1
        applyPrefillFromStore()
    }

    func refreshPreview() async {
        guard !transferPreviewTaskKey.isEmpty else {
            previewQuote = nil
            previewError = nil
            isLoadingPreview = false
            return
        }
        guard let from = fromAccount else { return }
        guard let value = parsedDebitAmount else { return }
        let destination: AccountTransferDestination
        switch recipientMode {
            case .own:
                guard let to = toAccount, from.id != to.id else { return }
                destination = .accountId(to.id)
            case .other:
                let t = trimmedOtherAccountId
                if UUID(uuidString: t) != nil {
                    destination = .accountId(t)
                } else {
                    destination = .accountNumber(t)
                }
        }
        isLoadingPreview = true
        previewError = nil
        defer { isLoadingPreview = false }
        do {
            previewQuote = try await accountRepository.previewTransfer(
                fromAccountId: from.id,
                to: destination,
                amount: value)
        } catch {
            previewQuote = nil
            previewError = error.displayMessage
        }
    }

    func syncPickersAfterFromAccountChange() {
        ensureValidPickers()
    }

    func submitTransfer() async {
        guard let from = fromAccount else {
            errorMessage = "Выберите счёт списания"
            return
        }
        guard let value = Decimal(string: amount.replacingOccurrences(of: ",", with: ".")),
              value >= 0.01
        else {
            errorMessage = "Введите сумму от 0,01"
            return
        }
        guard value <= from.balance else {
            errorMessage = "Недостаточно средств"
            return
        }
        let destination: AccountTransferDestination
        switch recipientMode {
            case .own:
                guard let to = toAccount, from.id != to.id else {
                    errorMessage = "Выберите счёт зачисления"
                    return
                }
                destination = .accountId(to.id)
            case .other:
                guard otherRecipientValid else {
                    errorMessage = "Укажите номер счёта или UUID получателя"
                    return
                }
                let t = trimmedOtherAccountId
                if UUID(uuidString: t) != nil {
                    destination = .accountId(t)
                } else {
                    destination = .accountNumber(t)
                }
        }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            try await accountRepository.transfer(
                fromAccountId: from.id,
                to: destination,
                amount: value)
            didSucceed = true
            amount = ""
            if recipientMode == .other {
                otherAccountIdText = ""
            }
            onAccountsChanged?()
            await loadAccounts()
        } catch {
            errorMessage = error.displayMessage
        }
    }

    private func ensureValidPickers() {
        if !activeAccounts.contains(where: { $0.id == fromAccountId }) {
            fromAccountId = activeAccounts.first?.id ?? ""
        }
        guard recipientMode == .own else { return }
        let candidates = toCandidates
        if !candidates.contains(where: { $0.id == toAccountId }) {
            toAccountId = candidates.first?.id ?? ""
        }
    }
}
