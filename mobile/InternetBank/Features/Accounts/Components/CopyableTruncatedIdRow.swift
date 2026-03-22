import SwiftUI
import UIKit

struct CopyableTruncatedIdRow: View {
    let title: String
    let uuid: String
    var prefixLength: Int = 8

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            (Text(title) + Text(verbatim: " #") + Text(String(uuid.prefix(prefixLength))) + Text("…"))
                .font(.headline)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
            Button {
                UIPasteboard.general.string = uuid
            } label: {
                Image(systemName: "doc.on.doc")
                    .font(.body)
            }
            .buttonStyle(.borderless)
            .accessibilityLabel("Скопировать полный номер")
        }
    }
}

#Preview {
    CopyableTruncatedIdRow(
        title: "Счёт",
        uuid: "00000000-0000-0000-0000-000000000001")
        .padding()
}
