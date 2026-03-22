import SwiftUI

struct CreditsCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    @Binding var path: NavigationPath
    @Binding var sheetItem: SheetItem?
    let creditsRefreshTrigger: Int
    let onOpenLinkedAccount: (String) -> Void

    var body: some View {
        viewFactory.makeCreditsListView(
            clientId: clientId,
            refreshTrigger: creditsRefreshTrigger,
            onCreditTap: { credit in
                path.append(CreditsRoute.detail(credit))
            },
            onTakeCredit: {
                sheetItem = .takeCredit(clientId)
            })
            .navigationDestination(for: CreditsRoute.self) { route in
                switch route {
                    case let .detail(credit):
                        viewFactory.makeCreditDetailView(
                            credit: credit,
                            clientId: clientId,
                            creditsRefreshTrigger: creditsRefreshTrigger,
                            onRepay: { suggested in
                                sheetItem = .repayCredit(credit, suggestedAmount: suggested)
                            },
                            onOpenLinkedAccount: onOpenLinkedAccount)
                }
            }
    }
}
