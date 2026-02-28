import SwiftUI

protocol CoordinatorProtocol: AnyObject {
    associatedtype ViewType: View
    func start() -> ViewType
}
