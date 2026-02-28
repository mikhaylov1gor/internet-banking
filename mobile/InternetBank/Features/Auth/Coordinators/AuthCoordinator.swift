import SwiftUI

final class AuthCoordinator {
    private let viewFactory: ViewFactoryProtocol

    init(viewFactory: ViewFactoryProtocol) {
        self.viewFactory = viewFactory
    }

    func start(onLoginSuccess: @escaping () -> Void) -> some View {
        viewFactory.makeLoginView(onSuccess: onLoginSuccess)
    }
}
