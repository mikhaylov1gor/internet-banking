import Foundation

#if DEBUG
import os

enum APILogger {
    private static let logger = Logger(subsystem: "InternetBank", category: "API")

    private static let sensitiveJSONKeys: Set<String> = [
        "token",
        "refreshToken",
        "refresh_token",
        "password",
        "accessToken",
        "access_token",
    ]

    static func logRequest(_ request: URLRequest) {
        guard logsOutboundBody(for: request) else { return }
        let method = request.httpMethod ?? "?"
        let url = request.url?.absoluteString ?? "?"
        let trace = request.value(forHTTPHeaderField: APITracing.traceIDHeaderField) ?? "-"
        let headers = formattedSafeHeaders(request)
        let bodyText = request.httpBody.map { formatBody($0) } ?? "<empty>"
        let headerBlock = headers.isEmpty ? "" : "\n\(headers)"
        let message = "→ [\(trace)] \(method) \(url)\(headerBlock)\n\(bodyText)"
        logger.debug("\(message, privacy: .public)")
    }

    static func logResponse(
        request: URLRequest,
        response: HTTPURLResponse,
        data: Data,
        duration: TimeInterval)
    {
        let method = request.httpMethod ?? "?"
        let url = request.url?.absoluteString ?? "?"
        let trace = request.value(forHTTPHeaderField: APITracing.traceIDHeaderField) ?? "-"
        let status = response.statusCode
        var suffix = ""
        if response.value(forHTTPHeaderField: "X-Idempotency-Cache") == "true" {
            suffix = " · idem-cache"
        }
        let ms = String(format: "%.0fms", duration * 1000)
        let body = formatBody(data)
        let message = "← [\(trace)] \(method) \(url) → \(status)\(suffix) · \(ms)\n\(body)"
        logger.debug("\(message, privacy: .public)")
    }

    private static func logsOutboundBody(for request: URLRequest) -> Bool {
        let method = (request.httpMethod ?? "").uppercased()
        switch method {
        case "POST", "PUT", "PATCH":
            return true
        case "DELETE":
            if let body = request.httpBody, !body.isEmpty { return true }
            return false
        default:
            return false
        }
    }

    private static func formattedSafeHeaders(_ request: URLRequest) -> String {
        guard let raw = request.allHTTPHeaderFields, !raw.isEmpty else { return "" }
        var lines: [String] = []
        for key in raw.keys.sorted() {
            guard let value = raw[key] else { continue }
            if key.lowercased() == "authorization" {
                lines.append("\(key): Bearer <redacted>")
            } else {
                lines.append("\(key): \(value)")
            }
        }
        return lines.joined(separator: "\n")
    }

    private static func formatBody(_ data: Data) -> String {
        guard !data.isEmpty else { return "<empty>" }
        let source = redactedJSONData(data)
        if let obj = try? JSONSerialization.jsonObject(with: source),
           let pretty = try? JSONSerialization.data(
            withJSONObject: obj,
            options: [.prettyPrinted, .sortedKeys]),
           let text = String(data: pretty, encoding: .utf8)
        {
            return text.count > 8192 ? String(text.prefix(8192)) + "\n…" : text
        }
        if let text = String(data: data, encoding: .utf8), text.count <= 4096 {
            return text
        }
        return "<\(data.count) bytes>"
    }

    private static func redactedJSONData(_ data: Data) -> Data {
        guard var root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return data
        }
        var changed = false
        for key in sensitiveJSONKeys where root[key] != nil {
            root[key] = "<redacted>"
            changed = true
        }
        guard changed else { return data }
        return (try? JSONSerialization.data(withJSONObject: root)) ?? data
    }
}
#endif
