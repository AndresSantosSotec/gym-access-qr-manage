/**
 * Utility functions for handling URLs across environments
 */

/**
 * Get the base API URL, auto-detecting based on environment
 */
export const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentHost = window.location.origin;
    if (currentHost.includes('irongymgt.com')) {
      return `${currentHost}/api`;
    }
  }
  
  return 'http://localhost:8000/api';
};

/**
 * Get the storage URL for uploaded files (same host as API so photos load from the server).
 */
export const getStorageUrl = (): string => {
  if (import.meta.env.VITE_STORAGE_URL) {
    return import.meta.env.VITE_STORAGE_URL;
  }
  // Derive from API URL so storage is always on the backend host (e.g. api.irongymgt.com/storage)
  const apiUrl = getApiUrl();
  const base = apiUrl.replace(/\/api\/?$/, '');
  return `${base}/storage`;
};

/**
 * Get the base backend URL without /api or /storage
 */
export const getBackendBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentHost = window.location.origin;
    if (currentHost.includes('irongymgt.com')) {
      return currentHost;
    }
  }
  
  return 'http://localhost:8000';
};

/**
 * Build a full URL for a storage file
 * @param path - The storage path (e.g., 'clients/photos/xyz.jpg')
 * @returns Full URL to the file
 */
export const buildStorageUrl = (path: string): string => {
  if (!path) return '';
  
  // If already a full URL, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  const storageUrl = getStorageUrl();
  return `${storageUrl}/${path}`;
};
