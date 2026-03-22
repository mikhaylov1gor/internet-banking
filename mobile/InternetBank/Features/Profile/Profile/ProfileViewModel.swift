import Foundation

@Observable
@MainActor
final class ProfileViewModel {
    var isLoading = false
    var errorMessage: String?
    var theme: String

    private let authRepository: AuthRepositoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings
    private let onAppSettingsChanged: () -> Void

    private var lastSyncedTheme: String
    private var lastSyncedHidden: Set<String> = []

    init(
        authRepository: AuthRepositoryProtocol,
        appSettingsRepository: AppSettingsRepositoryProtocol,
        clientAppSettings: ClientAppSettings,
        onAppSettingsChanged: @escaping () -> Void)
    {
        self.authRepository = authRepository
        self.appSettingsRepository = appSettingsRepository
        self.clientAppSettings = clientAppSettings
        self.onAppSettingsChanged = onAppSettingsChanged
        let initial = Self.normalizedTheme(clientAppSettings.themeRaw)
        theme = initial
        lastSyncedTheme = initial
    }

    private static func normalizedTheme(_ raw: String) -> String {
        switch raw.lowercased() {
            case "dark": return "dark"
            case "light": return "light"
            default: return "light"
        }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let settings = try await appSettingsRepository.getSettings(appType: "client")
            let t = Self.normalizedTheme(settings.theme)
            lastSyncedTheme = t
            lastSyncedHidden = Set(settings.hiddenAccountIds)
            theme = t
            clientAppSettings.apply(
                theme: t,
                hiddenAccountIds: settings.hiddenAccountIds)
            onAppSettingsChanged()
        } catch {
            errorMessage = error.displayMessage
        }
    }

    func saveTheme(_ newTheme: String) async {
        if newTheme == lastSyncedTheme {
            return
        }
        theme = newTheme
        clientAppSettings.apply(
            theme: newTheme,
            hiddenAccountIds: Array(clientAppSettings.hiddenAccountIds))
        await persistToServer(revertThemeOnFailure: true, notifyAccountsTab: false)
    }

    private func persistToServer(revertThemeOnFailure: Bool, notifyAccountsTab: Bool) async {
        errorMessage = nil
        do {
            let saved = try await appSettingsRepository.saveSettings(
                appType: "client",
                theme: theme,
                hiddenAccountIds: Array(clientAppSettings.hiddenAccountIds))
            clientAppSettings.apply(
                theme: saved.theme,
                hiddenAccountIds: saved.hiddenAccountIds)
            lastSyncedTheme = saved.theme
            lastSyncedHidden = Set(saved.hiddenAccountIds)
            if notifyAccountsTab {
                onAppSettingsChanged()
            }
        } catch {
            errorMessage = error.displayMessage
            if revertThemeOnFailure {
                theme = lastSyncedTheme
                clientAppSettings.apply(
                    theme: lastSyncedTheme,
                    hiddenAccountIds: Array(lastSyncedHidden))
            } else {
                clientAppSettings.apply(
                    theme: theme,
                    hiddenAccountIds: Array(lastSyncedHidden))
            }
        }
    }

    func logout() {
        authRepository.logout()
    }
}
