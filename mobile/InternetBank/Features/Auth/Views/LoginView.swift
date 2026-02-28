import SwiftUI

struct LoginView: View {
    @Bindable var viewModel: LoginViewModel

    var body: some View {
        Form {
            TextField("Логин", text: $viewModel.login)
                .textContentType(.username)
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
