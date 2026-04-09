import SwiftUI

@Observable
final class ClientAppSettings {
    var preferredColorScheme: ColorScheme?
    var hiddenAccountIds: Set<String> = []
    private(set) var themeRaw: String = "light"

    func apply(theme: String, hiddenAccountIds: [String]) {
        themeRaw = theme
        switch theme {
            case "dark":
                preferredColorScheme = .dark
            case "light":
                preferredColorScheme = .light
            default:
                preferredColorScheme = nil
        }
        self.hiddenAccountIds = Set(hiddenAccountIds)
    }
}
