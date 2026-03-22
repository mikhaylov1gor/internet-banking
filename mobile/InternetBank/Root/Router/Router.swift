import SwiftUI

enum MainTab: Hashable {
    case accounts
    case transfer
    case credits
    case profile
}

enum Route: Hashable {
    case accountDetail(Account)
    case operationHistory(Account)
}

enum CreditsRoute: Hashable {
    case detail(Credit)
}

enum SheetItem: Identifiable {
    case deposit(Account)
    case withdraw(Account)
    case openAccount(String)
    case closeAccount(Account)
    case takeCredit(String)
    case repayCredit(Credit, suggestedAmount: Decimal?)

    var id: String {
        switch self {
            case let .deposit(account): "deposit-\(account.id)"
            case let .withdraw(account): "withdraw-\(account.id)"
            case let .openAccount(clientId): "openAccount-\(clientId)"
            case let .closeAccount(account): "closeAccount-\(account.id)"
            case let .takeCredit(clientId): "takeCredit-\(clientId)"
            case let .repayCredit(credit, suggested):
                "repayCredit-\(credit.id)-\(suggested.map { NSDecimalNumber(decimal: $0).stringValue } ?? "none")"
        }
    }
}
