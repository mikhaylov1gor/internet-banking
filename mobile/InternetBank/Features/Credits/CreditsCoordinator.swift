import SwiftUI

struct CreditsCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    @Binding var sheetItem: SheetItem?
    let creditsRefreshTrigger: Int

    var body: some View {
        viewFactory.makeCreditsListView(
            clientId: clientId,
            refreshTrigger: creditsRefreshTrigger,
            onCreditTap: { credit in
                sheetItem = .repayCredit(credit)
            },
            onTakeCredit: {
                sheetItem = .takeCredit(clientId)
            })
    }
}
