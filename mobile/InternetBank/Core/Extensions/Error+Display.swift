import Foundation

extension Error {
    var displayMessage: String {
        if let apiError = self as? APIError {
            return apiError.errorDescription ?? localizedDescription
        }
        if let urlError = self as? URLError {
            switch urlError.code {
                case .notConnectedToInternet, .networkConnectionLost:
                    return "Нет подключения к интернету"
                case .timedOut:
                    return "Превышено время ожидания"
                case .cannotFindHost, .cannotConnectToHost:
                    return "Не удаётся подключиться к серверу"
                default:
                    break
            }
        }
        return (self as? LocalizedError)?.errorDescription ?? localizedDescription
    }
}
