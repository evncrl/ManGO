


// Set EXPO_PUBLIC_API_URL to the backend origin when testing on a device or in production.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'https://unacademic-amusingly-vernie.ngrok-free.dev ').replace(/\/+$/, '');