import Foundation

enum ClientBankFormat {
    static let accountNumberDigitCount = 16

    static func digitsOnlyAccountNumber(_ value: String) -> String {
        String(value.filter(\.isNumber).prefix(accountNumberDigitCount))
    }

    static func formatAccountNumberMasked(_ digits: String) -> String {
        let d = digitsOnlyAccountNumber(digits)
        var parts: [String] = []
        var i = d.startIndex
        while i < d.endIndex {
            let j = d.index(i, offsetBy: 4, limitedBy: d.endIndex) ?? d.endIndex
            parts.append(String(d[i ..< j]))
            i = j
        }
        return parts.joined(separator: "-")
    }

    static func formatShortId(_ id: String, visibleLength: Int = 8) -> String {
        let t = id.trimmingCharacters(in: .whitespacesAndNewlines)
        if t.isEmpty { return "—" }
        if t.count <= visibleLength { return t }
        return "\(t.prefix(visibleLength))…"
    }
}
