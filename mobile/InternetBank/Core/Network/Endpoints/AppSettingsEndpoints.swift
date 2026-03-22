import Foundation

enum AppSettingsEndpoints {
    static func settings(appType: String) -> String {
        "/app-settings/\(appType)"
    }
}
