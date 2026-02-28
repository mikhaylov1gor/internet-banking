import SwiftUI

struct OpenAccountView: View {
    @Bindable var viewModel: OpenAccountViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                }
                Button("Открыть счёт") {
                    Task { await viewModel.openAccount() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Открыть счёт")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
        }
    }
}
