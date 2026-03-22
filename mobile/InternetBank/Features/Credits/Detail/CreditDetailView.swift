import SwiftUI

struct CreditDetailView: View {
    @Bindable var viewModel: CreditDetailViewModel
    var onRepay: () -> Void
    var onOpenLinkedAccount: (String) -> Void

    private var isActiveCredit: Bool {
        (viewModel.credit.status ?? "active") == "active"
    }

    var body: some View {
        List {
            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                }
            }
            Section {
                CopyableTruncatedIdRow(title: "Кредит", uuid: viewModel.credit.id)
            }
            Section {
                LabeledContent("Сумма") {
                    Text("\(viewModel.credit.amount.formattedAmount) ₽")
                }
                if isActiveCredit {
                    LabeledContent("Остаток") {
                        Text("\(viewModel.credit.remainingAmount.formattedAmount) ₽")
                    }
                }
                if let rate = viewModel.credit.rate {
                    LabeledContent("Процентная ставка") {
                        Text("\(rate.formattedAmount)%")
                    }
                }
                LabeledContent("Статус") {
                    Text(viewModel.credit.statusDisplayTitle)
                }
                LabeledContent("Выдан") {
                    Text(viewModel.credit.issuedAt.formatted(date: .numeric, time: .omitted))
                }
                CopyableTruncatedIdRow(title: "Счёт", uuid: viewModel.credit.accountId)
                Button("Открыть счёт") {
                    onOpenLinkedAccount(viewModel.credit.accountId)
                }
            }
            if isActiveCredit {
                Section {
                    Button("Погасить кредит", action: onRepay)
                }
            }
        }
        .navigationTitle("Кредит")
        .refreshable {
            await viewModel.refreshCredit()
        }
        .task {
            await viewModel.refreshCredit()
        }
    }
}

#Preview {
    let credit = Credit(
        id: "00000000-0000-0000-0000-000000000010",
        clientId: "00000000-0000-0000-0000-000000000002",
        accountId: "00000000-0000-0000-0000-000000000001",
        tariffId: "00000000-0000-0000-0000-000000000020",
        amount: 100_000,
        remainingAmount: 80_000,
        issuedAt: Date(),
        tariffName: "Стандарт",
        rate: 12,
        status: "active")
    NavigationStack {
        CreditDetailView(
            viewModel: PreviewDependencies.factory.viewModelFactory.makeCreditDetailViewModel(
                credit: credit,
                clientId: "00000000-0000-0000-0000-000000000002"),
            onRepay: {},
            onOpenLinkedAccount: { _ in })
    }
}
