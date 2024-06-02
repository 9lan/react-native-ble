import Foundation

class Helper {
  static func formatCentralManagerState(_ state: CBManagerState) -> String {
    switch state {
    case .poweredOff:
      return "off"
    case .poweredOn:
      return "on"
    case .resetting:
      return "reset"
    case .unauthorized:
      return "unauthorized"
    case .unknown:
      return "unknown"
    case .unsupported:
      return "unsupported"
    @unknown default:
        return "unknown"
    }
  }
}
