import Foundation

enum AccountOperationMapping {
    static func from(dto: OperationResponse) -> AccountOperation? {
        guard let type = AccountOperation.OperationType(rawValue: dto.type) else { return nil }
        return AccountOperation(
            id: dto.id,
            accountId: dto.accountId,
            type: type,
            amount: Decimal(dto.amount),
            date: ISO8601DateFormatter().date(from: dto.createdAt) ?? Date(),
            balanceAfter: dto.balanceAfter.map { Decimal($0) },
            description: dto.description)
    }
}
