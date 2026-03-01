import SwiftUI

struct LoginView: View {
    @Bindable var viewModel: LoginViewModel

    var body: some View {
        Form {
            TextField("Email", text: $viewModel.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
            SecureField("Пароль", text: $viewModel.password)
                .textContentType(.password)
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }
            Button("Войти") {
                Task { await viewModel.signIn() }
            }
            .disabled(viewModel.isLoading)
        }
    }
}
