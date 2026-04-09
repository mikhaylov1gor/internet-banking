import Foundation

@Observable
@MainActor
final class AccountsListViewModel {
    enum VisibilityTab: String, CaseIterable {
        case regular
        case hidden

        var title: String {
            switch self {
                case .regular: return "Обычные"
                case .hidden: return "Скрытые"
            }
        }
    }

    var allAccounts: [Account] = []
    var selectedTab: VisibilityTab = .regular
    private(set) var hiddenAccountIds: Set<String> = []
    var isLoading = false
    var errorMessage: String?

    var displayedAccounts: [Account] {
        switch selectedTab {
            case .regular:
                return allAccounts.filter { !hiddenAccountIds.contains($0.id) }
            case .hidden:
                return allAccounts.filter { hiddenAccountIds.contains($0.id) }
        }
    }

    private let accountRepository: AccountRepositoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings
    private let clientId: String
    private let onAppSettingsChanged: () -> Void

    private var lastSyncedHidden: Set<String> = []

    init(
        accountRepository: AccountRepositoryProtocol,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings,
        clientId: String,
        onAppSettingsChanged: @escaping () -> Void)
    {
        self.accountRepository = accountRepository
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
        self.clientId = clientId
        self.onAppSettingsChanged = onAppSettingsChanged
        self.hiddenAccountIds = clientAppSettings.hiddenAccountIds
        self.lastSyncedHidden = clientAppSettings.hiddenAccountIds
    }

    func loadAccounts() async {
        isLoading = true
        errorMessage = nil
        do {
            allAccounts = try await accountRepository.getAccounts(clientId: clientId)
            hiddenAccountIds = clientAppSettings.hiddenAccountIds
            lastSyncedHidden = hiddenAccountIds
        } catch {
            errorMessage = error.displayMessage
        }
        isLoading = false
    }

    func setAccountHidden(accountId: String, hidden: Bool) async {
        let previousHidden = hiddenAccountIds
        var next = previousHidden
        if hidden {
            next.insert(accountId)
        } else {
            next.remove(accountId)
        }
        hiddenAccountIds = next
        clientAppSettings.apply(
            theme: clientAppSettings.themeRaw,
            hiddenAccountIds: Array(next))
        errorMessage = nil
        do {
            let saved = try await appSettingsRepository.saveSettings(
                appType: "client",
                theme: clientAppSettings.themeRaw,
                hiddenAccountIds: Array(next))
            clientAppSettings.apply(
                theme: saved.theme,
                hiddenAccountIds: saved.hiddenAccountIds)
            lastSyncedHidden = Set(saved.hiddenAccountIds)
            hiddenAccountIds = lastSyncedHidden
            onAppSettingsChanged()
        } catch {
            errorMessage = error.displayMessage
            hiddenAccountIds = previousHidden
            clientAppSettings.apply(
                theme: clientAppSettings.themeRaw,
                hiddenAccountIds: Array(previousHidden))
        }
    }
}
