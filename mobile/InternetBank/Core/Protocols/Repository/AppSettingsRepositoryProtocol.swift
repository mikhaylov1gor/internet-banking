import Foundation

protocol AppSettingsRepositoryProtocol: AnyObject {
    func getSettings(appType: String) async throws -> AppSettingsDTO
    func saveSettings(appType: String, theme: String, hiddenAccountIds: [String]) async throws -> AppSettingsDTO
}
