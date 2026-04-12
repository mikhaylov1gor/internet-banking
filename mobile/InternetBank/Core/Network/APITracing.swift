import Foundation
import os

enum APITracing {
    static let traceIDHeaderField = "trace-id"

    static func newTraceID() -> String {
        UUID().uuidString
    }

    private static let logger = Logger(subsystem: "InternetBank", category: "Tracing")

    static func logSpan(
        traceID: String?,
        method: String,
        url: String,
        statusCode: Int,
        durationMs: Int)
    {
        let tid = traceID ?? "-"
        let line = String(repeating: "=", count: 16)
        if (200 ... 299).contains(statusCode) {
            logger.info("\(method, privacy: .public) \(url, privacy: .public) status=\(statusCode) \(durationMs)ms trace=\(tid, privacy: .public)")
        } else {
            let banner = "\(line) HTTP \(statusCode) FAILED \(line)"
            logger.error("\(banner, privacy: .public)\n\(method, privacy: .public) \(url, privacy: .public) status=\(statusCode) \(durationMs)ms trace=\(tid, privacy: .public)\n\(banner, privacy: .public)")
        }
    }
}
