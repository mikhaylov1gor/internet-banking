import SwiftUI

enum Route: Hashable {
    case accountDetail(Account)
    case operationHistory(Account)
}

enum SheetItem: Identifiable {
    case deposit(Account)
    case withdraw(Account)
    case openAccount(String)
    case closeAccount(Account)
    case takeCredit(String)
    case repayCredit(Credit)

    var id: String {
        switch self {
        case .deposit(let account): "deposit-\(account.id)"
        case .withdraw(let account): "withdraw-\(account.id)"
        case .openAccount(let clientId): "openAccount-\(clientId)"
        case .closeAccount(let account): "closeAccount-\(account.id)"
        case .takeCredit(let clientId): "takeCredit-\(clientId)"
        case .repayCredit(let credit): "repayCredit-\(credit.id)"
        }
    }
}

