import SwiftUI
import UIKit

struct AccountSummaryCard: View {
    let account: Account
    var showsVisibilityToggle: Bool = false
    var visibilityToggleShowsEyeForReveal: Bool = false
    var onTap: (() -> Void)?
    var onToggleVisibility: (() -> Void)?

    private let cornerRadius: CGFloat = 12

    private var statusTint: Color {
        account.status.lowercased() == "active" ? ClientBankTheme.statusActive : ClientBankTheme.statusClosed
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("Счёт")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ClientBankTheme.primaryStart)
                    Button {
                        UIPasteboard.general.string = account.clipboardAccountReference
                    } label: {
                        Text(account.displayAccountNumber)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(ClientBankTheme.textAccent)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Скопировать номер счёта")
                }
                Text("Баланс: \(account.balance.formattedAmount) \(account.currency)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(account.statusDisplayTitle)
                    .font(.caption)
                    .foregroundStyle(statusTint)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if showsVisibilityToggle, let onToggleVisibility {
                Button(action: onToggleVisibility) {
                    Image(systemName: visibilityToggleShowsEyeForReveal ? "eye" : "eye.slash")
                        .font(.body)
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.borderless)
                .accessibilityLabel(visibilityToggleShowsEyeForReveal ? "Показать на главном" : "Скрыть с главного")
            }
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background {
            shape.fill(Color(.secondarySystemGroupedBackground))
        }
        .overlay {
            shape.strokeBorder(Color(.separator), lineWidth: 0.5)
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
        status: "active",
        accountNumber: "4081781000123456")
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
        status: "active",
        accountNumber: "4081781000999999")
    AccountSummaryCard(account: account)
        .padding()
}
