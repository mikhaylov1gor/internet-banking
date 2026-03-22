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
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Picker("Валюта", selection: $viewModel.selectedCurrencyCode) {
                    ForEach(OpenAccountViewModel.currencyCodes, id: \.self) { code in
                        Text(code).tag(code)
                    }
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

#Preview {
    OpenAccountView(
        viewModel: PreviewDependencies.factory.viewModelFactory.makeOpenAccountViewModel(
            clientId: "00000000-0000-0000-0000-000000000002"),
        onDismiss: {})
}
