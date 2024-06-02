export type Peripheral = {
  name: string;
  id: string;
  RSSI: number;
};

export enum ReactNativeBleEvents {
  'ReactNativeBleDidStartScan' = 'ReactNativeBleDidStartScan',
  'ReactNativeBleDidStopScan' = 'ReactNativeBleDidStopScan',
  'ReactNativeBleDiscoverPeripheral' = 'ReactNativeBleDiscoverPeripheral',
  'ReactNativeBleConnectPeripheral' = 'ReactNativeBleConnectPeripheral',
}
