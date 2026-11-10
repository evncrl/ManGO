

import axios from 'axios';

// Set EXPO_PUBLIC_API_URL to the backend origin when testing on a device or in production.
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_URL = (
	configuredApiUrl || 'https://unacademic-amusingly-vernie.ngrok-free.dev'
).trim().replace(/\/+$/, '');

export const API_HEADERS = {
	Accept: 'application/json',
	'ngrok-skip-browser-warning': 'true',
};

axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
axios.defaults.headers.common.Accept = 'application/json';

export const apiFetch: typeof fetch = (input, init) => {
	const headers = new Headers(init?.headers);
	for (const [name, value] of Object.entries(API_HEADERS)) {
		if (name === 'ngrok-skip-browser-warning' || !headers.has(name)) {
			headers.set(name, value);
		}
	}

	return fetch(input, { ...init, headers });
};