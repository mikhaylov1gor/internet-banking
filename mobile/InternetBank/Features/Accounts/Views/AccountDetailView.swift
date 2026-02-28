import SwiftUI

struct AccountDetailView: View {
    @Bindable var viewModel: AccountDetailViewModel
    var onDeposit: () -> Void
    var onWithdraw: () -> Void
    var onHistory: () -> Void
    var onCloseAccount: () -> Void

    var body: some View {
        List {
            Section {
                Text("Баланс: \(viewModel.account.balance) ₽")
            }
            Section {
                Button("Внести деньги") { onDeposit() }
                Button("Снять деньги") { onWithdraw() }
                Button("История операций") { onHistory() }
                Button("Закрыть счёт", role: .destructive) { onCloseAccount() }
            }
        }
        .navigationTitle("Счёт")
        .task {
            await viewModel.refresh()
        }
    }
}
