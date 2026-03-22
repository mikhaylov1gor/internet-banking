import SwiftUI

struct CreditDetailView: View {
    @Bindable var viewModel: CreditDetailViewModel
    var onRepay: () -> Void

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                }
                Group {
                    Text("Сумма: \(viewModel.credit.amount.formattedAmount) ₽")
                    Text("Остаток: \(viewModel.credit.remainingAmount.formattedAmount) ₽")
                    if let rate = viewModel.credit.rate {
                        Text("Ставка: \(rate.formattedAmount)% годовых")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if viewModel.isLoadingRating {
                    ProgressView()
                } else if let r = viewModel.rating {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Кредитный рейтинг")
                            .font(.headline)
                        Text("Балл: \(r.score)")
                        Text("Риск: \(r.riskLevel)")
                        Text("Просрочки: \(r.overdueCount), на сумму \(Decimal(r.overdueAmount).formattedAmount) ₽")
                    }
                    if let status = viewModel.credit.status {
                        Text("Статус: \(status)")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button("Загрузить рейтинг") {
                    Task { await viewModel.loadRating() }
                }

                if viewModel.isLoadingOverdue {
                    ProgressView()
                } else if let o = viewModel.overdue {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Просрочка")
                            .font(.headline)
                        Text("Сумма просрочки: \(Decimal(o.overdueAmount).formattedAmount) ₽")
                        Text("Платежей с просрочкой: \(o.overduePayments)")
                        Text("Ожидалось: \(Decimal(o.expectedPaid).formattedAmount) ₽")
                        Text("Фактически: \(Decimal(o.actualPaid).formattedAmount) ₽")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button("Проверить просрочку по кредиту") {
                    Task { await viewModel.loadOverdue() }
                }

                Button("Погасить кредит", action: onRepay)
                    .buttonStyle(.borderedProminent)
            }
            .padding()
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
            onRepay: {})
    }
}
