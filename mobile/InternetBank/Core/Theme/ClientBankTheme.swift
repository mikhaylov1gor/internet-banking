import SwiftUI

enum ClientBankTheme {
    static let primaryStart = Color(red: 37 / 255, green: 99 / 255, blue: 235 / 255)
    static let primaryEnd = Color(red: 59 / 255, green: 130 / 255, blue: 246 / 255)
    static let textAccent = Color(red: 30 / 255, green: 64 / 255, blue: 175 / 255)
    static let textSecondary = Color(red: 100 / 255, green: 116 / 255, blue: 139 / 255)
    static let textDefault = Color(red: 30 / 255, green: 41 / 255, blue: 59 / 255)
    static let statusActive = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255)
    static let statusPaidCredit = Color(red: 59 / 255, green: 130 / 255, blue: 246 / 255)
    static let statusPaidMuted = Color(red: 100 / 255, green: 116 / 255, blue: 139 / 255)
    static let statusOverdue = Color(red: 239 / 255, green: 68 / 255, blue: 68 / 255)
    static let statusClosed = Color(red: 239 / 255, green: 68 / 255, blue: 68 / 255)
    static let creditAmount = Color(red: 30 / 255, green: 64 / 255, blue: 175 / 255)
    static let creditRemaining = Color(red: 239 / 255, green: 68 / 255, blue: 68 / 255)
    static let link = Color(red: 59 / 255, green: 130 / 255, blue: 246 / 255)
    static let linkHover = Color(red: 37 / 255, green: 99 / 255, blue: 235 / 255)
    static let cardBorder = Color(red: 219 / 255, green: 234 / 255, blue: 254 / 255)
    static let cardSurfaceStart = Color.white
    static let cardSurfaceEnd = Color(red: 248 / 255, green: 250 / 255, blue: 252 / 255)
    static let paymentBadgePendingBg = Color.secondary.opacity(0.14)
    static let paymentBadgePaidBg = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255).opacity(0.16)
    static let paymentBadgeOverdueBg = Color(red: 254 / 255, green: 242 / 255, blue: 242 / 255)

    static var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [primaryStart, primaryEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing)
    }

    static var cardBackgroundGradient: LinearGradient {
        LinearGradient(
            colors: [cardSurfaceStart, cardSurfaceEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing)
    }
}
