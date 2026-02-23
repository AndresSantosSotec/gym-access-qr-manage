/**
 * RecurrenteCheckoutEmbed
 *
 * Componente React que integra el checkout embebido de Recurrente
 * usando la librería recurrente-checkout (iframe).
 *
 * Uso:
 *   <RecurrenteCheckoutEmbed
 *     checkoutUrl="https://app.recurrente.com/checkout-session/ch_xxx"
 *     onSuccess={(data) => { ... }}
 *     onFailure={(error) => { ... }}
 *     onPaymentInProgress={(data) => { ... }}
 *   />
 */

import { useEffect } from 'react';

interface RecurrenteCheckoutEmbedProps {
  /** URL del checkout de Recurrente (checkout_url del backend) */
  checkoutUrl: string;
  /** Callback cuando el pago es exitoso */
  onSuccess?: (paymentData: any) => void;
  /** Callback cuando el pago falla */
  onFailure?: (error: any) => void;
  /** Callback para transferencias bancarias en proceso */
  onPaymentInProgress?: (data: any) => void;
  /** Altura del iframe (default: 850px) */
  height?: string;
  /** Clase CSS del contenedor */
  className?: string;
}

export function RecurrenteCheckoutEmbed({
  checkoutUrl,
  onSuccess,
  onFailure,
  onPaymentInProgress,
  height = '850px',
  className = '',
}: RecurrenteCheckoutEmbedProps) {

  // 1. Asegurarnos que la URL lleve el flag embed=true
  const embedUrl = checkoutUrl
    ? (checkoutUrl.includes('embed=true') ? checkoutUrl : `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}embed=true`)
    : '';

  useEffect(() => {
    if (!embedUrl) return;

    // 2. Escuchar los eventos postMessage que emite el iframe de Recurrente
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://app.recurrente.com') return;

      const data = event.data;
      if (!data) return;

      if (data.type === 'recurrente-plugin:payment-success') {
        console.log('[RecurrenteEmbed] Pago exitoso:', data);
        onSuccess?.(data);
      } else if (data.type === 'recurrente-plugin:payment-failed') {
        console.log('[RecurrenteEmbed] Pago fallido:', data);
        onFailure?.(data);
      } else if (data.type === 'recurrente-plugin:payment-in-progress') {
        console.log('[RecurrenteEmbed] Pago en proceso:', data);
        onPaymentInProgress?.(data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [embedUrl, onSuccess, onFailure, onPaymentInProgress]);

  if (!embedUrl) return null;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <iframe
        title="Recurrente Checkout"
        src={embedUrl}
        className="w-full border-0 overflow-hidden select-none"
        style={{ minHeight: height }}
        allow="payment *"
      />
    </div>
  );
}
