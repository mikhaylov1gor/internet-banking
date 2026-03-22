import SwiftUI

struct AccountSummaryCard: View {
    let account: Account
    var showsVisibilityToggle: Bool = false
    var visibilityToggleShowsEyeForReveal: Bool = false
    var onTap: (() -> Void)?
    var onToggleVisibility: (() -> Void)?

    private let cornerRadius: CGFloat = 16

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Счёт \(account.id.prefix(8))...")
                    .font(.headline)
                Text("\(account.balance.formattedAmount) \(account.currencySymbol)")
                    .font(.title2)
                Text(account.currency)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if showsVisibilityToggle, let onToggleVisibility {
                Button(action: onToggleVisibility) {
                    Image(systemName: visibilityToggleShowsEyeForReveal ? "eye" : "eye.slash")
                        .font(.title3)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.borderless)
                .accessibilityLabel(visibilityToggleShowsEyeForReveal ? "Показать на главном" : "Скрыть с главного")
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            shape.fill(Color(.secondarySystemGroupedBackground))
        }
        .overlay {
            shape.strokeBorder(Color(.separator), lineWidth: 1)
        }
        .contentShape(shape)
        .modifier(OptionalCardTapModifier(onTap: onTap))
    }
}

private struct OptionalCardTapModifier: ViewModifier {
    let onTap: (() -> Void)?

    func body(content: Content) -> some View {
        if let onTap {
            content.onTapGesture(perform: onTap)
        } else {
            content
        }
    }
}

#Preview("Карточка") {
    let account = Account(
        id: "00000000-0000-0000-0000-000000000001",
        clientId: "00000000-0000-0000-0000-000000000002",
        balance: 15_420.50,
        currency: "RUB",
        openedAt: Date(),
        status: "active")
    AccountSummaryCard(
        account: account,
        showsVisibilityToggle: true,
        visibilityToggleShowsEyeForReveal: false,
        onTap: {},
        onToggleVisibility: {})
        .padding()
}

#Preview("Только просмотр") {
    let account = Account(
        id: "00000000-0000-0000-0000-000000000001",
        clientId: "00000000-0000-0000-0000-000000000002",
        balance: 100,
        currency: "USD",
        openedAt: Date(),
        status: "active")
    AccountSummaryCard(account: account)
        .padding()
}
