import SwiftUI

struct ProfileView: View {
    @Bindable var viewModel: ProfileViewModel
    var onLogout: () -> Void

    var body: some View {
        Form {
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
            }
            Section("Оформление") {
                Picker("Тема", selection: $viewModel.theme) {
                    Text("Светлая").tag("light")
                    Text("Тёмная").tag("dark")
                }
                .onChange(of: viewModel.theme) { _, newValue in
                    Task { await viewModel.saveTheme(newValue) }
                }
            }
            Section {
                Button("Выйти", role: .destructive) {
                    viewModel.logout()
                    WebAuthContextCleaner.clearAuthWebContext()
                    onLogout()
                }
            }
        }
        .navigationTitle("Профиль")
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
        .task {
            await viewModel.load()
        }
    }
}

#Preview {
    let ra = RepositoryAssembly()
    NavigationStack {
        ProfileView(
            viewModel: FactoryAssembly(repositoryAssembly: ra).viewModelFactory.makeProfileViewModel(
                onAppSettingsChanged: {}),
            onLogout: {})
    }
}
