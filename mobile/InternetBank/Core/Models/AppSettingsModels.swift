import Foundation

struct AppSettingsDTO: Codable {
    let appType: String
    let theme: String
    let hiddenAccountIds: [String]
}

struct AppSettingsUpdateRequest: Encodable {
    let theme: String
    let hiddenAccountIds: [String]
}
