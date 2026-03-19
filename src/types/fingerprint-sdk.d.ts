/**
 * TypeScript declarations for the DigitalPersona U.are.U WebSDK.
 * The SDK is loaded as a global script (window.Fingerprint) from public/scripts/.
 *
 * Required files in public/scripts/:
 *   - es6-shim.js
 *   - websdk.client.bundle.min.js
 *   - fingerprint.sdk.min.js
 */

declare global {
  interface FingerprintWebApi {
    /** Fires when a reader is connected or becomes available. */
    onDeviceConnected: (() => void) | null;
    /** Fires when a reader is disconnected. */
    onDeviceDisconnected: (() => void) | null;
    /** Fires when communication with the local DigitalPersona agent fails. */
    onCommunicationFailed: (() => void) | null;
    /**
     * Fires each time a finger scan sample is acquired.
     * `s.samples` is a JSON string: string[] of base64url-encoded image data.
     */
    onSamplesAcquired: ((s: { samples: string }) => void) | null;
    /**
     * Fires after each sample with the capture quality.
     * `e.quality` is a numeric code (0 = Good).
     */
    onQualityReported: ((e: { quality: number }) => void) | null;

    /** Returns a Promise that resolves to a list of device UIDs. */
    enumerateDevices(): Promise<string[]>;
    /**
     * Starts continuous fingerprint acquisition on the given device.
     * @param format - A value from `Fingerprint.SampleFormat`
     * @param deviceUid - UID from `enumerateDevices()`. Omit to use first available.
     */
    startAcquisition(format: number, deviceUid?: string): Promise<void>;
    /** Stops the active acquisition session. */
    stopAcquisition(): Promise<void>;
  }

  interface FingerprintSDK {
    SampleFormat: {
      /** Delivers a base64-encoded PNG image per scan. */
      PngImage: number;
      /** Delivers raw sensor data. */
      Raw: number;
      /** Delivers compressed (WSQ) data. */
      Compressed: number;
      /** Delivers an intermediate feature set. */
      Intermediate: number;
    };
    /** Maps numeric quality codes to human-readable strings, e.g. QualityCode[0] = "Good". */
    QualityCode: { [code: number]: string };
    /** Converts a URL-safe base64 string to standard base64. */
    b64UrlTo64(b64url: string): string;
    /** The main WebAPI class — wraps the WebSocket connection to the local agent. */
    WebApi: new () => FingerprintWebApi;
  }

  interface Window {
    /**
     * DigitalPersona WebSDK — available only when the SDK scripts are loaded.
     * Check for existence before use: `window.Fingerprint?.WebApi`.
     */
    Fingerprint?: FingerprintSDK;
  }
}

export {};
