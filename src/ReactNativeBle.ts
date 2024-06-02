import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { ReactNativeBleEvents } from './types';

const LINKING_ERROR =
  `The package '@9lan/react-native-ble' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

/**
 * Checks if `NativeModules.ReactNativeBle` exists.
 * If it does, it assigns `NativeModules.ReactNativeBle` to `ReactNativeBleNative`.
 * If `NativeModules.ReactNativeBle` does not exist, it creates a new Proxy object that throws an error
 * with the message defined in `LINKING_ERROR`.
 */
const ReactNativeBleNative = NativeModules.ReactNativeBle
  ? NativeModules.ReactNativeBle
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
const ReactNativeBleEmitter = new NativeEventEmitter(ReactNativeBleNative);

/**
 *  The `ReactNativeBleWrapper` class provides methods for starting and stopping scanning for peripherals,
 *  as well as adding and removing event listeners.
 *
 * @method startScan - Start scanning for peripherals
 * @method stopScan - Stop scanning for peripherals
 * @method addListener - Add an event listener
 * @method removeAllListeners - Remove all event listeners
 */
class ReactNativeBleWrapper {
  /**
   * The `startScan` function initiates a Bluetooth scan using ReactNativeBleNative.
   *
   * @returns A Promise is being returned from the `startScan` function.
   */
  public startScan(): Promise<void> {
    return new Promise((resolve, reject) => {
      ReactNativeBleNative.startScan()
        .then(() => resolve())
        .catch((error: any) => {
          reject(new Error(`Failed to start scan ${error}`));
        });
    });
  }

  /**
   * The `stopScan` function terminates a Bluetooth scan using ReactNativeBleNative.
   *
   * @returns A Promise is being returned from the `stopScan` function.
   */
  public stopScan(): Promise<void> {
    return new Promise((resolve, reject) => {
      ReactNativeBleNative.stopScan()
        .then(() => resolve())
        .catch((error: any) => {
          reject(new Error(`Failed to stop scan ${error}`));
        });
    });
  }

  /**
   * The `addListener` function adds an event listener for a specific event name and
   * executes a handler function when the event occurs.
   *
   * @param {keyof typeof ReactNativeBleEvents} eventName - The `eventName` parameter is the
   * name of the event to listen for.
   *
   * @param handler - The `handler` parameter is a function that takes an `event` as
   * its argument and returns `void`. This function will be called whenever the
   * specified event occurs.
   */
  public addListener(
    eventName: keyof typeof ReactNativeBleEvents,
    handler: (event: any) => void
  ) {
    return ReactNativeBleEmitter.addListener(eventName, handler);
  }

  /**
   * The function `removeAllListeners` removes all listeners for a specific event from the
   * ReactNativeBleEmitter.
   *
   * @param {keyof typeof ReactNativeBleEvents} eventName - It represents the name of the
   * event for which listeners need to be removed.
   */
  public removeAllListeners(eventName: keyof typeof ReactNativeBleEvents) {
    return ReactNativeBleEmitter.removeAllListeners(eventName);
  }
}

export const ReactNativeBle = new ReactNativeBleWrapper();
