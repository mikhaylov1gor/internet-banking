import SwiftUI

final class AppCoordinator {
    private let coordinatorFactory: CoordinatorFactoryProtocol
    private let authRepository: AuthRepositoryProtocol
    private let sessionState: SessionState

    init(
        coordinatorFactory: CoordinatorFactoryProtocol,
        authRepository: AuthRepositoryProtocol,
        sessionState: SessionState)
    {
        self.coordinatorFactory = coordinatorFactory
        self.authRepository = authRepository
        self.sessionState = sessionState
    }

    func start() -> some View {
        AppCoordinatorView(
            coordinatorFactory: coordinatorFactory,
            authRepository: authRepository,
            sessionState: sessionState)
    }
}

struct AppCoordinatorView: View {
    let coordinatorFactory: CoordinatorFactoryProtocol
    let authRepository: AuthRepositoryProtocol
    @Bindable var sessionState: SessionState

    @State private var isAuthenticated = false

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
        .onChange(of: sessionState.didSessionExpire) { _, expired in
            if expired {
                isAuthenticated = false
                sessionState.resetSessionExpired()
            }
        }
    }
}
