// Type declaration for the recurrente-checkout UMD library
// Loaded via <script> tag in index.html — available as window.RecurrenteCheckout

interface RecurrenteCheckoutOptions {
  url: string;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
  onPaymentInProgress?: (data?: any) => void;
  development?: boolean;
}

interface RecurrenteCheckoutLib {
  load(options: RecurrenteCheckoutOptions): void;
}

declare global {
  interface Window {
    RecurrenteCheckout: RecurrenteCheckoutLib;
  }
  const RecurrenteCheckout: RecurrenteCheckoutLib;
}

export {};
