import Foundation

@Observable
@MainActor
final class ProfileViewModel {
    var isLoading = false
    var errorMessage: String?
    var theme: String = "light"

    private let authRepository: AuthRepositoryProtocol
    private let appSettingsRepository: AppSettingsRepositoryProtocol
    private let clientAppSettings: ClientAppSettings
    private let onAppSettingsChanged: () -> Void

    private var lastSyncedTheme: String = "light"
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
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let settings = try await appSettingsRepository.getSettings(appType: "client")
            lastSyncedTheme = settings.theme
            lastSyncedHidden = Set(settings.hiddenAccountIds)
            theme = settings.theme
            clientAppSettings.apply(
                theme: settings.theme,
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
