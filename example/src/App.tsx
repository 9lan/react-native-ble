import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StatusBar,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  useColorScheme,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { ReactNativeBle, type Peripheral } from '@9lan/react-native-ble';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.black : Colors.lighter,
  };

  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Peripheral[]>([]);

  /**
   * `handleDiscoverPeripheral` function updates the list of discovered devices by filtering out the
   * device with the same ID, adding the new device, and sorting the list based on RSSI values.
   * @param {Peripheral} peripheralInfo - The `peripheralInfo` parameter is an object containing
   * information about a peripheral device. It includes properties such as `id`, `name`, and `RSSI`
   * (signal strength).
   */
  const handleDiscoverPeripheral = (peripheralInfo: Peripheral) => {
    setDiscoveredDevices((prevDevices) => {
      const updatedDevices = prevDevices.filter(
        (device) => device.id !== peripheralInfo.id
      );
      updatedDevices.push(peripheralInfo);
      return updatedDevices.sort((a, b) => b.RSSI - a.RSSI);
    });
  };

  /**
   * `handleStartScan` function initiates a Bluetooth scan
   */
  const handleStartScan = () => {
    ReactNativeBle.startScan()
      .then(() => {
        setIsScanning(true);
        // console.log('Scanning...');
      })
      .catch((error: any) => {
        setIsScanning(false);
        resetScan();
        // console.error(error);
        throw new Error(`Failed to start scan ${error}`);
      });
  };

  /**
   * `handleStopScan` function terminates a Bluetooth scan, resets the scan, logs a message, handles
   */
  const handleStopScan = () => {
    ReactNativeBle.stopScan()
      .then(() => {
        resetScan();
        // console.log('Scan stopped');
      })
      .catch((error: any) => {
        // console.error(error);
        throw new Error(`Failed to stop scan ${error}`);
      })
      .finally(() => {
        setIsScanning(false);
      });
  };

  const resetScan = () => {
    setDiscoveredDevices([]);
  };

  useEffect(() => {
    ReactNativeBle.addListener(
      'ReactNativeBleDiscoverPeripheral',
      handleDiscoverPeripheral
    );

    return () => {
      ReactNativeBle.removeAllListeners('ReactNativeBleDiscoverPeripheral');
    };
  }, []);

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentContainerStyle={styles.mainBody}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={[
            styles.body,
            {
              backgroundColor: isDarkMode ? Colors.black : Colors.lighter,
            },
          ]}
        >
          <View style={styles.bluetoothCtn}>
            <Text
              style={[
                styles.title,
                {
                  color: isDarkMode ? Colors.white : Colors.black,
                },
              ]}
            >
              Scan devices
            </Text>

            <Switch
              trackColor={{ false: '#767577', true: '#30D158' }}
              thumbColor={isScanning ? '#f4f3f4' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={isScanning ? handleStopScan : handleStartScan}
              value={isScanning}
            />
          </View>

          <View style={styles.deviceListCtn}>
            {(isScanning || discoveredDevices.length > 0) && (
              <View style={styles.deviceListTitleCtn}>
                <Text style={styles.deviceListTitle}>Available Devices</Text>
                <ActivityIndicator
                  size="small"
                  color="#767577"
                  animating={isScanning}
                />
              </View>
            )}
            {discoveredDevices.map((device, index) => (
              <View
                key={index}
                style={[styles.bluetoothCtn, styles.deviceListItemCtn]}
              >
                <Text style={styles.deviceListItemTitle}>{device?.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const windowHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: windowHeight,
  },
  mainBody: {
    paddingTop: 32,
    paddingBottom: 16,
  },
  body: {
    marginBottom: 40,
  },

  /** Bluetooth */
  bluetoothCtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 16,
    height: 50,
  },

  buttonStyle: {
    backgroundColor: '#307ecc',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#307ecc',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 15,
  },
  buttonTextStyle: {
    color: '#FFFFFF',
    paddingVertical: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  deviceListCtn: {
    marginTop: 20,
  },
  deviceListTitleCtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 10,
    gap: 5,
  },
  deviceListTitle: {
    fontSize: 16,
    color: '#9C9CA4',
    fontWeight: '400',
  },
  deviceListItemCtn: {
    marginBottom: 5,
  },
  deviceListItemTitle: {
    fontSize: 16,
    color: '#fff',
  },
});
