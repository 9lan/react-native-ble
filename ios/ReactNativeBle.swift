import Foundation
import CoreBluetooth

// define event names as static constants
// to make our code more readable
private struct Event {
  static let didStartScan = "ReactNativeBleDidStartScan"
  static let didStopScan = "ReactNativeBleDidStopScan"
  static let discoverPeripheral = "ReactNativeBleDiscoverPeripheral"
}

@objc(ReactNativeBle)
class ReactNativeBle: RCTEventEmitter, CBCentralManagerDelegate, CBPeripheralDelegate {
  private var centralManager: CBCentralManager!
  private var isScanning: Bool = false
  
  var discoveredPeripherals: [CBPeripheral] = []
  var peripheralsAwaitingName: [UUID: () -> Void] = [:]

  // init the BLE manager and set the delegate
  override init() {
    super.init()
    centralManager = CBCentralManager(delegate: self, queue: nil)
  }
  
  // list of supported events to be used in the app
  override func supportedEvents() -> [String]! {
    return [Event.didStartScan, Event.didStopScan, Event.discoverPeripheral]
  }
  
  @objc(requiresMainQueueSetup)
    override static func requiresMainQueueSetup() -> Bool {
      return false
    }

  @objc func startScan(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if !isScanning {
      centralManager.scanForPeripherals(withServices: nil, options: [
        CBCentralManagerScanOptionAllowDuplicatesKey: false,
        CBConnectPeripheralOptionNotifyOnConnectionKey: false,
        CBConnectPeripheralOptionNotifyOnDisconnectionKey: false,
        CBConnectPeripheralOptionNotifyOnNotificationKey: false
      ])
      isScanning = true
      sendEvent(withName: Event.didStartScan, body: nil)
      resolve(nil)
    } else {
      let error = NSError(domain: "com.reactNativeBle", code: -1, userInfo: [NSLocalizedDescriptionKey: "Scan already in progress"])
      reject("scan_in_progress", "Scan already in progress", error)
    }
  }

  @objc func stopScan(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if isScanning {
      centralManager.stopScan()
      isScanning = false
      sendEvent(withName: Event.didStopScan, body: nil)
      resolve(nil)
    } else {
      let error = NSError(domain: "com.reactNativeBle", code: -1, userInfo: [NSLocalizedDescriptionKey: "No scan in progress"])
      reject("no_scan_in_progress", "No scan in progress", error)
    }
  }

  // handle state updates
  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    // handle state changes if needed
    let stateString = Helper.formatCentralManagerState(central.state)
    // just log the state for now
    print("Bluetooth state: \(stateString)")
  }

  // handle discovered peripherals
  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
    var name = peripheral.name ?? "Unknown Device"
    
    // update device name if available in advertisement data
    if let localName = advertisementData[CBAdvertisementDataLocalNameKey] as? String {
      name = localName
    } else if name == "Unknown Device" {
      // connect to the peripheral to get its name
      peripheral.delegate = self
      centralManager.connect(peripheral, options: nil)
      peripheralsAwaitingName[peripheral.identifier] = { [weak self] in
        guard let self = self else { return }
        self.addDiscoveredPeripheral(peripheral, rssi: RSSI, advertisementData: advertisementData)
      }
      return
    }
    
    addDiscoveredPeripheral(peripheral, rssi: RSSI, advertisementData: advertisementData)
  }
  
  // handle successful connection
  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    peripheral.delegate = self
    if peripheral.name == nil || peripheral.name == "Unknown Device" {
      peripheral.discoverServices(nil)
    } else {
      centralManager.cancelPeripheralConnection(peripheral)
    }
  }
  
  // handle discovery of services
  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    if let services = peripheral.services {
      for service in services {
        peripheral.discoverCharacteristics(nil, for: service)
      }
    }
  }
  
  // handle discovery of characteristics for a service
  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    for characteristic in service.characteristics ?? [] {
      peripheral.readValue(for: characteristic)
    }
  }
  
  // tells the delegate that retrieving the specified characteristic’s value succeeded,
  // or that the characteristic’s value changed.
  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    // disconnect from the peripheral once we have the value
    centralManager.cancelPeripheralConnection(peripheral)
  }

  // handle peripheral name updates
  func peripheralDidUpdateName(_ peripheral: CBPeripheral) {
    if let resolve = peripheralsAwaitingName.removeValue(forKey: peripheral.identifier) {
      resolve()
    }
  }
  
  // handle peripheral disconnection
  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    if let resolve = peripheralsAwaitingName.removeValue(forKey: peripheral.identifier) {
      resolve()
    }
  }
  
  // add a discovered peripheral to the list and send an event to the JavaScript side
  private func addDiscoveredPeripheral(_ peripheral: CBPeripheral, rssi: NSNumber, advertisementData: [String: Any]) {
    if !discoveredPeripherals.contains(where: { $0.identifier == peripheral.identifier }) {
      discoveredPeripherals.append(peripheral)
      let peripheralInfo: [String: Any] = [
        "name": peripheral.name ?? "Unknown Device",
        "id": peripheral.identifier.uuidString,
        "RSSI": rssi
      ]
      sendEvent(withName: Event.discoverPeripheral, body: peripheralInfo)
    }
  }
}
