import SwiftUI

struct CloseAccountView: View {
    @Bindable var viewModel: CloseAccountViewModel
    var onDismiss: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.red)
                }
                Button("Закрыть счёт", role: .destructive) {
                    Task { await viewModel.closeAccount() }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("Закрыть счёт")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { onDismiss() }
                }
            }
        }
    }
}
