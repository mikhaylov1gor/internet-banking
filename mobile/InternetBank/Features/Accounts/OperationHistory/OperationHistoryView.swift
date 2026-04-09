import SwiftUI

struct OperationHistoryView: View {
    @Bindable var viewModel: OperationHistoryViewModel

    var body: some View {
        List(viewModel.operations) { op in
            VStack(alignment: .leading, spacing: 8) {
                Text(op.displayTitle)
                    .font(.headline)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(op.date, format: .dateTime.day().month(.twoDigits).year().hour().minute())
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text("\(op.amount.formattedAmount) \(viewModel.currencySymbol)")
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                if let after = op.balanceAfter {
                    Text("Баланс после: \(after.formattedAmount) \(viewModel.currencySymbol)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let desc = op.description, !desc.isEmpty, desc != "перевод между счетами" {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.vertical, 6)
            .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
        }
        .navigationTitle("История операций")
        .refreshable {
            await viewModel.load()
        }
        .task {
            await viewModel.load()
            viewModel.startRealtimeUpdates()
        }
        .onDisappear {
            viewModel.stopRealtimeUpdates()
        }
    }
}

#Preview {
    let account = Account(
        id: "00000000-0000-0000-0000-000000000001",
        clientId: "00000000-0000-0000-0000-000000000002",
        balance: 0,
        currency: "RUB",
        openedAt: Date(),
        status: "active",
        accountNumber: "4081781000123456")
    NavigationStack {
        OperationHistoryView(
            viewModel: PreviewDependencies.factory.viewModelFactory.makeOperationHistoryViewModel(
                account: account))
    }
}
