import { useState, useEffect, useRef, useCallback } from 'react';
/// <reference types="../types/fingerprint-sdk" />

export interface FingerprintSample {
  /** Full data URL ready for <img src={...} />: "data:image/png;base64,..." */
  imageDataUrl: string;
  /** Raw base64 without the data-URL prefix — what the backend expects */
  imageBase64: string;
}

export function useFingerprint(onSample?: (s: FingerprintSample) => void) {
  const sdkRef = useRef<FingerprintWebApi | null>(null);
  // Keep a ref to onSample so we never close over a stale version
  const onSampleRef = useRef(onSample);
  useEffect(() => { onSampleRef.current = onSample; });

  const [sdkReady, setSdkReady]           = useState(false);
  const [readers, setReaders]             = useState<string[]>([]);
  const [selectedReader, setSelectedReader] = useState('');
  const [status, setStatus]               = useState('Inicializando SDK...');
  const [qualityText, setQualityText]     = useState('');
  const [isCapturing, setIsCapturing]     = useState(false);

  // Mirrors exactly what the vanilla example does in window.onload
  useEffect(() => {
    const fp = window.Fingerprint;
    if (!fp?.WebApi) {
      setStatus('Scripts del SDK no cargados — asegúrate de que los 3 archivos estén en public/scripts/ y recarga la página.');
      return;
    }

    // WebApi constructor calls new WebSdk.WebChannelClient() internally.
    // If websdk.client.bundle.min.js didn't load, this throws a ReferenceError.
    let sdk: FingerprintWebApi;
    try {
      sdk = new fp.WebApi();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Error al inicializar WebApi: ${msg} — verifica que websdk.client.bundle.min.js esté en public/scripts/ y que el agente DigitalPersona esté instalado.`);
      console.error('[useFingerprint] new Fingerprint.WebApi() falló:', e);
      return;
    }

    // Equivalent to: test = new FingerprintSdkTest();
    sdk.onDeviceConnected    = () => setStatus('Lector conectado.');
    sdk.onDeviceDisconnected = () => { setStatus('Lector desconectado.'); setIsCapturing(false); };
    sdk.onCommunicationFailed = () => {
      setStatus('Sin comunicación con el agente DigitalPersona. Instala e inicia el agente WebAPI y recarga la página.');
      setIsCapturing(false);
    };

    // Mirrors sampleAcquired() in app.js — PngImage format
    sdk.onSamplesAcquired = (s) => {
      try {
        const samples: string[] = JSON.parse(s.samples);
        // Same line as example: "data:image/png;base64," + Fingerprint.b64UrlTo64(samples[0])
        const imageDataUrl = 'data:image/png;base64,' + fp.b64UrlTo64(samples[0]);
        const imageBase64  = fp.b64UrlTo64(samples[0]); // raw base64 for backend
        onSampleRef.current?.({ imageDataUrl, imageBase64 });
      } catch (e: unknown) {
        setStatus('Error procesando muestra: ' + (e instanceof Error ? e.message : String(e)));
      }
    };

    // Mirrors: document.getElementById("qualityInputBox").value = Fingerprint.QualityCode[(e.quality)]
    sdk.onQualityReported = (e) => {
      setQualityText(fp.QualityCode?.[e.quality] ?? String(e.quality));
    };

    sdkRef.current = sdk;
    setSdkReady(true);

    // Mirrors readersDropDownPopulate() — enumerate on load
    sdk.enumerateDevices()
      .then((devs) => {
        setReaders(devs);
        if (devs.length === 1) {
          setSelectedReader(devs[0]);
          setStatus('Lector detectado. Presiona "Iniciar Registro".');
        } else if (devs.length === 0) {
          setStatus('No se detectaron lectores. Conecta el lector USB y refresca.');
        } else {
          setStatus('Selecciona un lector y presiona "Iniciar Registro".');
        }
      })
      .catch((err: unknown) => {
        setStatus('Error al enumerar lectores: ' + (err instanceof Error ? err.message : String(err)));
      });

    return () => {
      // Cleanup: stop acquisition like test.stopCapture() on page unload
      sdk.stopAcquisition().catch(() => {});
    };
  }, []); // once on mount — mirrors window.onload

  // Mirrors onStart() → test.startCapture()
  const startCapture = useCallback(() => {
    const sdk = sdkRef.current;
    const fp  = window.Fingerprint;
    if (!sdk || !fp || !selectedReader) return;

    const format = fp.SampleFormat?.PngImage ?? 1; // Fingerprint.SampleFormat.PngImage

    sdk.startAcquisition(format, selectedReader)
      .then(() => {
        setIsCapturing(true);
        setStatus('Coloca el dedo en el lector...');
      })
      .catch((err: unknown) => {
        setStatus('Error al iniciar captura: ' + (err instanceof Error ? err.message : String(err)));
      });
  }, [selectedReader]);

  // Mirrors onStop() → test.stopCapture()
  const stopCapture = useCallback(() => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    sdk.stopAcquisition()
      .then(() => setIsCapturing(false))
      .catch(() => setIsCapturing(false));
  }, []);

  // Mirrors readersDropDownPopulate(false)
  const refreshReaders = useCallback(() => {
    const sdk = sdkRef.current;
    if (!sdk) return;
    sdk.enumerateDevices()
      .then((devs) => {
        setReaders(devs);
        if (devs.length === 1) setSelectedReader(devs[0]);
        setStatus(devs.length === 0 ? 'No se detectaron lectores.' : `${devs.length} lector(es) disponible(s).`);
      })
      .catch((err: unknown) => {
        setStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
      });
  }, []);

  return { sdkReady, readers, selectedReader, setSelectedReader, status, qualityText, isCapturing, startCapture, stopCapture, refreshReaders };
}



