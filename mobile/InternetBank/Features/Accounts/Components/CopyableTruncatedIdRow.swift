import SwiftUI
import UIKit

struct CopyableTruncatedIdRow: View {
    let title: String
    let uuid: String
    var prefixLength: Int = 8

    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            (Text(title) + Text(verbatim: " #") + Text(String(uuid.prefix(prefixLength))) + Text("…"))
                .font(.headline)
            Button {
                UIPasteboard.general.string = uuid
            } label: {
                Image(systemName: "doc.on.doc")
            }
            .accessibilityLabel("Скопировать полный номер")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    CopyableTruncatedIdRow(
        title: "Счёт",
        uuid: "00000000-0000-0000-0000-000000000001")
        .padding()
}
