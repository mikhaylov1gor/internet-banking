import SwiftUI
import UIKit

struct CopyableValueRow: View {
    let title: String
    let value: String
    let copyValue: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Button {
                UIPasteboard.general.string = copyValue
            } label: {
                Image(systemName: "doc.on.doc")
            }
            .buttonStyle(.borderless)
            .accessibilityLabel("Скопировать")
        }
    }
}

#Preview {
    CopyableValueRow(
        title: "Номер счёта",
        value: "4081781000123456",
        copyValue: "4081781000123456")
        .padding()
}
