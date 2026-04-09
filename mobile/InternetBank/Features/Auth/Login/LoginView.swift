import SwiftUI

struct LoginView: View {
    let authRepository: AuthRepositoryProtocol
    let onLoginSuccess: () -> Void

    var body: some View {
        WebAuthView(
            authRepository: authRepository,
            onSuccess: onLoginSuccess
        )
        .ignoresSafeArea()
    }
}

#Preview {
    LoginView(
        authRepository: RepositoryAssembly().authRepository,
        onLoginSuccess: {})
}
