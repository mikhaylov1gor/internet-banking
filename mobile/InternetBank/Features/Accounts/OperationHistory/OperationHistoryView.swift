import SwiftUI

struct OperationHistoryView: View {
    @Bindable var viewModel: OperationHistoryViewModel

    var body: some View {
        List(viewModel.operations) { op in
            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline) {
                    Text(op.displayTitle)
                        .font(.headline)
                    Spacer()
                    Text(op.date, format: .dateTime.day().month(.twoDigits).year().hour().minute())
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Text("\(op.amount.formattedAmount) \(viewModel.currencySymbol)")
                    Spacer()
                    if let after = op.balanceAfter {
                        Text("Баланс после: \(after.formattedAmount) \(viewModel.currencySymbol)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                if let desc = op.description, !desc.isEmpty, desc != "перевод между счетами" {
                    Text(desc)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 4)
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
        status: "active")
    NavigationStack {
        OperationHistoryView(
            viewModel: PreviewDependencies.factory.viewModelFactory.makeOperationHistoryViewModel(
                account: account))
    }
}
