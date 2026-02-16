import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
// import "@github/spark/spark" // Comentado para desarrollo local

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { ThemeProvider } from "./components/ThemeProvider";
import { initializeSeedData } from './utils/seed'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

initializeSeedData();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </ErrorBoundary>
)
