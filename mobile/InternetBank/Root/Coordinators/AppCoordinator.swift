import SwiftUI

final class AppCoordinator {
    private let coordinatorFactory: CoordinatorFactoryProtocol
    private let authRepository: AuthRepositoryProtocol

    init(
        coordinatorFactory: CoordinatorFactoryProtocol,
        authRepository: AuthRepositoryProtocol
    ) {
        self.coordinatorFactory = coordinatorFactory
        self.authRepository = authRepository
    }

    func start() -> some View {
        AppCoordinatorView(
            coordinatorFactory: coordinatorFactory,
            authRepository: authRepository
        )
    }
}

struct AppCoordinatorView: View {
    let coordinatorFactory: CoordinatorFactoryProtocol
    let authRepository: AuthRepositoryProtocol

    @State private var isAuthenticated: Bool = false
    @State private var clientId: String = ""

    var body: some View {
        Group {
            if isAuthenticated, let id = authRepository.currentUserId {
                coordinatorFactory.makeMainCoordinator(clientId: id)
                    .start {
                        isAuthenticated = false
                    }
            } else {
                coordinatorFactory.makeAuthCoordinator()
                    .start {
                        isAuthenticated = true
                    }
            }
        }
        .onAppear {
            isAuthenticated = authRepository.isAuthenticated
        }
    }
}
