/**
 * Payload de enrollment biométrico (6 muestras guiadas) hacia Laravel.
 */
export interface FingerprintEnrollmentPayload {
  /** 6 imágenes base64 en orden de captura (1..6) */
  templates: string[];
  /** Códigos de variante alineados con cada muestra (misma longitud que templates) */
  captureVariants: string[];
  /** Código de calidad del SDK DigitalPersona por muestra (o null si no hubo reporte) */
  qualitySamples: (number | null)[];
  /** ISO 8601 por muestra (opcional) */
  capturedAtSamples?: string[];
}

export const ENROLLMENT_CAPTURE_VARIANTS = [
  'center_normal',
  'rotate_left',
  'rotate_right',
  'pressure_firm',
  'pressure_light',
  'validation_free',
] as const;

export type EnrollmentCaptureVariant = (typeof ENROLLMENT_CAPTURE_VARIANTS)[number];
