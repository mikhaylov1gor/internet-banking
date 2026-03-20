import SwiftUI

struct WithdrawView: View {
    @Bindable var viewModel: WithdrawViewModel
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
                Button("Снять") {
                    Task { await viewModel.withdraw() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Снять деньги")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
        }
    }
}
