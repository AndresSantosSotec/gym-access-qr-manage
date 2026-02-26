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
 * Get the storage URL for uploaded files, auto-detecting based on environment
 */
export const getStorageUrl = (): string => {
  if (import.meta.env.VITE_STORAGE_URL) {
    return import.meta.env.VITE_STORAGE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentHost = window.location.origin;
    if (currentHost.includes('irongymgt.com')) {
      return `${currentHost}/storage`;
    }
  }
  
  return 'http://localhost:8000/storage';
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
