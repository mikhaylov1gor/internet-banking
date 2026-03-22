import Foundation

final class AppSettingsRepository: AppSettingsRepositoryProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getSettings(appType: String) async throws -> AppSettingsDTO {
        try await apiClient.request(
            path: AppSettingsEndpoints.settings(appType: appType))
    }

    func saveSettings(appType: String, theme: String, hiddenAccountIds: [String]) async throws -> AppSettingsDTO {
        let body = AppSettingsUpdateRequest(theme: theme, hiddenAccountIds: hiddenAccountIds)
        return try await apiClient.request(
            path: AppSettingsEndpoints.settings(appType: appType),
            method: "PUT",
            body: body)
    }
}
