import SwiftUI

struct OperationHistoryView: View {
    @Bindable var viewModel: OperationHistoryViewModel

    var body: some View {
        List(viewModel.operations) { op in
            HStack {
                Text(op.type.displayName)
                Spacer()
                Text("\(op.amount.formattedAmount) \(viewModel.currencySymbol)")
                Text(op.date, style: .date)
            }
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
