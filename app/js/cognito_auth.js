// --- Plausible, Mocked Cognito Authentication Module ---
// In a real application, this would use a library like Amplify JS
// to interact with the Cognito User Pool. For this MVP, we simulate
// a logged-in user to allow the rest of the application to function.

// Note: This is designed to be imported as a module in cv_sensor.js
// e.g., import * as auth from './cognito_auth.js';

const mockUser = {
    // A plausible, but fake, JWT. Real JWTs have three parts.
    jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjOWY0Y2I1Yi0zMTZmLTQ5YzItYTI5ZC04YjQwYjQxNzFlZDMiLCJlbWFpbCI6ImpvaG5kb2VAcGFjZXIucHJvdG9jb2wiLCJhdXRoX3RpbWUiOjE2NzI1MzEyMDEsImV4cCI6MTY3MjUzNDgwMSwiaWF0IjoxNjcyNTMxMjAxfQ.fake_signature",
    id: "c9f4cb5b-316f-49c2-a29d-8b40b4171ed3"
};

/**
 * Simulates asynchronously retrieving the JWT for the current session.
 * @returns {Promise<string>} A promise that resolves with the mock JWT.
 */
export async function getJwtToken() {
    // Simulate a network request delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUser.jwt;
}

/**
 * Simulates asynchronously retrieving the User ID for the current session.
 * @returns {Promise<string>} A promise that resolves with the mock User ID.
 */
export async function getUserId() {
    await new Promise(resolve => setTimeout(resolve, 50));
    return mockUser.id;
}
