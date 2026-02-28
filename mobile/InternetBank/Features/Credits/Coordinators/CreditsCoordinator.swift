import SwiftUI

struct CreditsCoordinatorView: View {
    let viewFactory: ViewFactoryProtocol
    let clientId: String
    @Binding var sheetItem: SheetItem?

    var body: some View {
        viewFactory.makeCreditsListView(
            clientId: clientId,
            onCreditTap: { credit in
                sheetItem = .repayCredit(credit)
            },
            onTakeCredit: {
                sheetItem = .takeCredit(clientId)
            }
        )
    }
}
