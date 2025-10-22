/**
 * @file baseline_store.js
 * @description Manages all interactions with IndexedDB for storing and retrieving
 * user physiological baselines, session data, and user settings.
 * This store is the single source of truth for on-device persistent data.
 */

const DB_NAME = '101MonkeysDB';
const DB_VERSION = 1;
const STORES = {
    SESSIONS: 'sessions', // Stores individual session logs
    BASELINES: 'baselines', // Stores calculated rolling baselines (median/MAD)
    USER_SETTINGS: 'userSettings' // Stores user preferences, like sync toggle
};

let db = null;

/**
 * Initializes the IndexedDB database and creates object stores if they don't exist.
 * This function must be called and awaited before any other database operations.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
async function initDB() {
    if (db) {
        return Promise.resolve(db);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject('Error opening IndexedDB.');
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORES.SESSIONS)) {
                dbInstance.createObjectStore(STORES.SESSIONS, { keyPath: 'sessionId' });
            }
            if (!dbInstance.objectStoreNames.contains(STORES.BASELINES)) {
                // Using a known key 'currentUser' to store a single baseline object
                dbInstance.createObjectStore(STORES.BASELINES, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(STORES.USER_SETTINGS)) {
                dbInstance.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB initialized successfully.');
            resolve(db);
        };
    });
}

/**
 * Saves a completed session object to the database.
 * @param {object} sessionData - The session data to store. Must include a unique `sessionId`.
 * @returns {Promise<void>}
 */
async function saveSession(sessionData) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SESSIONS], 'readwrite');
        const store = transaction.objectStore(STORES.SESSIONS);
        const request = store.put(sessionData);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error('Error saving session:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves the last N sessions to be used for baseline calculation.
 * @param {number} count - The number of recent sessions to retrieve.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of session objects.
 */
async function getRecentSessions(count = 7) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SESSIONS], 'readonly');
        const store = transaction.objectStore(STORES.SESSIONS);
        const sessions = [];
        // To get the last N, we open a cursor and iterate backwards.
        const request = store.openCursor(null, 'prev');

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && sessions.length < count) {
                sessions.push(cursor.value);
                cursor.continue();
            } else {
                resolve(sessions);
            }
        };
        request.onerror = (event) => {
            console.error('Error getting recent sessions:', event.target.error);
            reject(event.target.error);
        };
    });
}


/**
 * A robust function to calculate the median of an array of numbers.
 * @param {number[]} arr - An array of numbers.
 * @returns {number|null} The median value or null if the array is empty.
 */
function calculateMedian(arr) {
    if (!arr || arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * A robust function to calculate the Median Absolute Deviation (MAD).
 * @param {number[]} arr - An array of numbers.
 * @returns {number|null} The MAD value or null if the array is empty.
 */
function calculateMAD(arr) {
    if (!arr || arr.length === 0) return null;
    const median = calculateMedian(arr);
    if (median === null) return null;
    const deviations = arr.map(x => Math.abs(x - median));
    return calculateMedian(deviations);
}


/**
 * Updates the user's physiological baselines (median and MAD for each metric)
 * based on the last 7 sessions. This is a computationally intensive operation
 * that should be run after a session is logged.
 * @returns {Promise<object>} The newly calculated baseline object.
 */
async function updateUserBaselines() {
    const sessions = await getRecentSessions(7);
    if (sessions.length === 0) {
        console.warn('Not enough sessions to calculate baseline.');
        // Return a default or seed baseline if needed
        return null;
    }

    const metrics = {
        rmssd: [],
        respVar: [],
        pupilPV: [],
        // Add other metrics as needed
    };

    sessions.forEach(session => {
        // Ensure you are using post-session metrics for baseline where appropriate
        if (typeof session.rmssdPost === 'number') metrics.rmssd.push(session.rmssdPost);
        if (typeof session.respVarPost === 'number') metrics.respVar.push(session.respVarPost);
        if (typeof session.pupilPVPost === 'number') metrics.pupilPV.push(session.pupilPVPost);
    });

    const newBaseline = {
        id: 'currentUser', // Static key for our single-user baseline object
        rmssd: { median: calculateMedian(metrics.rmssd), mad: calculateMAD(metrics.rmssd) },
        respVar: { median: calculateMedian(metrics.respVar), mad: calculateMAD(metrics.respVar) },
        pupilPV: { median: calculateMedian(metrics.pupilPV), mad: calculateMAD(metrics.pupilPV) },
        updatedAt: new Date().toISOString()
    };


    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.BASELINES], 'readwrite');
        const store = transaction.objectStore(STORES.BASELINES);
        const request = store.put(newBaseline);

        request.onsuccess = () => {
            console.log('Baselines updated successfully:', newBaseline);
            resolve(newBaseline);
        };
        request.onerror = (event) => {
            console.error('Error updating baselines:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Retrieves the current user's baseline object.
 * @returns {Promise<object|null>} The baseline object or null if not found.
 */
async function getCurrentBaseline() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.BASELINES], 'readonly');
        const store = transaction.objectStore(STORES.BASELINES);
        const request = store.get('currentUser');

        request.onsuccess = (event) => {
            resolve(event.target.result || null); // Return baseline or null
        };
        request.onerror = (event) => {
            console.error('Error getting current baseline:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Export functions for use in other modules
export {
    initDB,
    saveSession,
    updateUserBaselines,
    getCurrentBaseline
};
