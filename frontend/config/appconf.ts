


// Set EXPO_PUBLIC_API_URL to the backend origin when testing on a device or in production.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '');