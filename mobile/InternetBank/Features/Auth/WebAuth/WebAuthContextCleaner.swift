import Foundation
import WebKit

enum WebAuthContextCleaner {
    static func clearAuthWebContext() {
        guard let authURL = URL(string: Config.authAppURL),
              let host = authURL.host else { return }
        let store = WKWebsiteDataStore.default()
        store.fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) { records in
            let matching = records.filter { record in
                record.displayName.contains(host) || record.displayName == host
            }
            guard !matching.isEmpty else { return }
            store.removeData(
                ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                for: matching,
                completionHandler: {}
            )
        }
    }
}
