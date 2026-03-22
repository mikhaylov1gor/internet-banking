import SwiftUI

struct DepositView: View {
    @Bindable var viewModel: DepositViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                TextField("Сумма", text: $viewModel.amount)
                    .keyboardType(.decimalPad)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Button("Внести") {
                    Task { await viewModel.deposit() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Внести деньги")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
        }
    }
}
