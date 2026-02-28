import SwiftUI

struct ProfileView: View {
    @Bindable var viewModel: ProfileViewModel
    var onLogout: () -> Void

    var body: some View {
        Form {
            Button("Выйти", role: .destructive) {
                viewModel.logout()
                onLogout()
            }
        }
        .navigationTitle("Профиль")
    }
}
