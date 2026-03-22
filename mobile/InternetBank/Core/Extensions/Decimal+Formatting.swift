import Foundation

extension Decimal {
    var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        formatter.decimalSeparator = ","
        formatter.groupingSeparator = " "
        return formatter.string(from: self as NSDecimalNumber) ?? "\(self)"
    }

    func roundedToScale(_ scale: Int) -> Decimal {
        var x = self
        var r = Decimal()
        NSDecimalRound(&r, &x, scale, .plain)
        return r
    }
}
