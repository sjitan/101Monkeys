// --- API Module for Pacer Protocol ---
// Handles communication with the backend API Gateway.

// This module relies on a global config object or a config file.
// For this MVP, we'll assume config is loaded and available.
// In a real app, you'd fetch 'config/config.json'.
const API_BASE_URL = "https://api.101monkeys.com"; // From config

/**
 * Generates a UUID v4 for the idempotency key.
 * @returns {string} A new UUID.
 */
function generateIdempotencyKey() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : `mock-uuid-${Date.now()}`;
}

/**
 * Posts collected physiological data to the /pacer/data endpoint.
 *
 * @param {object} data The payload to send (e.g., { userId, rmssd, ... }).
 * @param {string} jwt The Cognito JWT for authorization.
 * @returns {Promise<object>} A promise that resolves with the JSON response from the API.
 */
export async function postPacerData(data, jwt) {
    const endpoint = `${API_BASE_URL}/pacer/data`;
    const idempotencyKey = generateIdempotencyKey();

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors', // Important for cross-origin requests
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`,
                'x-idempotency-key': idempotencyKey
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            // Log the error response for debugging
            const errorBody = await response.text();
            console.error('API Error Response:', errorBody);
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Failed to post data to pacer API:', error);
        // Re-throw the error so the caller can handle it
        throw error;
    }
}
