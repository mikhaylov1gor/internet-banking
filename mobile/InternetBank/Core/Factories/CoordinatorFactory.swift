import SwiftUI

final class CoordinatorFactory: CoordinatorFactoryProtocol {
    private let viewFactory: ViewFactoryProtocol

    init(viewFactory: ViewFactoryProtocol) {
        self.viewFactory = viewFactory
    }

    func makeAuthCoordinator() -> AuthCoordinator {
        AuthCoordinator(viewFactory: viewFactory)
    }

    func makeMainCoordinator(clientId: String) -> MainCoordinator {
        MainCoordinator(viewFactory: viewFactory, clientId: clientId)
    }
}
