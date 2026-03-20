import SwiftUI

protocol CoordinatorFactoryProtocol: AnyObject {
    func makeAuthCoordinator() -> AuthCoordinator
    func makeMainCoordinator(clientId: String) -> MainCoordinator
}
