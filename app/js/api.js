import { getJwtToken } from './cognito_auth.js';

let config;

async function getConfig() {
    if (!config) {
        const response = await fetch('/config/config.json');
        config = await response.json();
    }
    return config;
}

export async function postData(payload) {
    const appConfig = await getConfig();
    const token = await getJwtToken();

    const response = await fetch(`${appConfig.API_BASE_URL}/pacer/data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    const debugScores = response.headers.get('X-Debug-Scores');
    const responseBody = await response.json();

    return { body: responseBody, debug: debugScores };
}
