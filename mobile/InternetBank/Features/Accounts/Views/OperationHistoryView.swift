import SwiftUI

struct OperationHistoryView: View {
    @Bindable var viewModel: OperationHistoryViewModel

    var body: some View {
        List(viewModel.operations) { op in
            HStack {
                Text(op.type.displayName)
                Spacer()
                Text("\(op.amount) ₽")
                Text(op.date, style: .date)
            }
        }
        .navigationTitle("История операций")
        .task {
            await viewModel.load()
        }
    }
}
