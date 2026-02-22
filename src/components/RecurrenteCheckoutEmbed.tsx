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

import { useEffect, useRef, useCallback } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Solo aceptar mensajes de Recurrente
      if (event.origin !== 'https://app.recurrente.com') return;

      if (event.data?.type === 'recurrente-plugin:payment-success') {
        console.log('[RecurrenteCheckout] Pago exitoso:', event.data);
        onSuccess?.(event.data);
      } else if (event.data?.type === 'recurrente-plugin:payment-failed') {
        console.log('[RecurrenteCheckout] Pago fallido:', event.data);
        onFailure?.(event.data);
      } else if (event.data?.type === 'recurrente-plugin:payment-in-progress') {
        console.log('[RecurrenteCheckout] Pago en proceso:', event.data);
        onPaymentInProgress?.(event.data);
      }
    },
    [onSuccess, onFailure, onPaymentInProgress],
  );

  useEffect(() => {
    if (!checkoutUrl || !containerRef.current) return;

    // Limpiar listener anterior si existe
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
    }

    // Registrar nuevo listener
    listenerRef.current = handleMessage;
    window.addEventListener('message', handleMessage);

    // Construir URL con embed=true
    let iframeSrc = checkoutUrl;
    if (!iframeSrc.includes('embed=true')) {
      const separator = iframeSrc.includes('?') ? '&' : '?';
      iframeSrc = `${iframeSrc}${separator}embed=true`;
    }

    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'recurrente-checkout-iframe';
    iframe.src = iframeSrc;
    iframe.style.cssText = `width: 100%; height: ${height}; border: none; overflow: hidden; border-radius: 12px;`;
    iframe.allow = 'payment';
    iframe.title = 'Recurrente Checkout';

    // Limpiar y agregar
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);

    return () => {
      if (listenerRef.current) {
        window.removeEventListener('message', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [checkoutUrl, handleMessage, height]);

  return (
    <div
      ref={containerRef}
      id="recurrente-checkout-container"
      className={`w-full ${className}`}
      style={{ minHeight: height }}
    />
  );
}
