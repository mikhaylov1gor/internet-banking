import SwiftUI

struct RepayCreditView: View {
    @Bindable var viewModel: RepayCreditViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Сумма", text: $viewModel.amount)
                    .keyboardType(.decimalPad)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                }
                Button("Погасить") {
                    Task { await viewModel.repay() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Погасить кредит")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
        }
    }
}
