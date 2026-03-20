import SwiftUI
import WebKit

struct WebAuthView: View {
    let authRepository: AuthRepositoryProtocol
    let onSuccess: () -> Void

    var body: some View {
        WebAuthWebViewRepresentable(
            authRepository: authRepository,
            onSuccess: onSuccess
        )
    }
}

private struct WebAuthWebViewRepresentable: UIViewRepresentable {
    let authRepository: AuthRepositoryProtocol
    let onSuccess: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(authRepository: authRepository, onSuccess: onSuccess)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.processPool = WKProcessPool()
        config.userContentController.add(context.coordinator, name: "authSuccess")
        let script = WKUserScript(
            source: """
            (function() {
                window.addEventListener('message', function(e) {
                    var d = e.data;
                    if (d && d.type === 'auth_success' && d.payload && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.authSuccess) {
                        window.webkit.messageHandlers.authSuccess.postMessage(JSON.stringify({ type: d.type, payload: d.payload }));
                    }
                });
            })();
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        config.userContentController.addUserScript(script)
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        if let url = URL(string: Config.authAppURL + "?iswebview=true") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        private let authRepository: AuthRepositoryProtocol
        private let onSuccess: () -> Void

        init(authRepository: AuthRepositoryProtocol, onSuccess: @escaping () -> Void) {
            self.authRepository = authRepository
            self.onSuccess = onSuccess
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "authSuccess",
                  let body = message.body as? String,
                  let data = body.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let payload = json["payload"] as? [String: Any],
                  let accessToken = payload["access_token"] as? String,
                  let refreshToken = payload["refresh_token"] as? String,
                  let userId = payload["user_id"] as? String else { return }
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.authRepository.completeWebAuth(accessToken: accessToken, refreshToken: refreshToken, userId: userId)
                WebAuthContextCleaner.clearAuthWebContext()
                self.onSuccess()
            }
        }
    }
}

#Preview {
    WebAuthView(
        authRepository: MockAuthRepository(authService: AuthService(keychain: KeychainStorage())),
        onSuccess: {}
    )
}
