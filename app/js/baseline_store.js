/**
 * @file baseline_store.js
 * @description Manages robust, rolling storage and retrieval of baselines and sessions using IndexedDB.
 */

import config from './policy_config.json';

const DB_NAME = 'MonkeysDB';
const DB_VERSION = 1;
const SESSION_STORE_NAME = 'Sessions';
const BASELINE_STORE_NAME = 'Baselines';
const BASELINE_KEY = 'UserBaselines';

let db = null;

// Helper function to calculate Median
const calculateMedian = (arr) => {
    if (!arr || arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Helper function to calculate Median Absolute Deviation (MAD)
const calculateMAD = (arr) => {
    if (!arr || arr.length === 0) return null;
    const median = calculateMedian(arr);
    if (median === null) return null;
    const deviations = arr.map(x => Math.abs(x - median));
    return calculateMedian(deviations);
};

// Initializes the IndexedDB connection and schema.
const openDB = () => {
    if (db) return Promise.resolve(db);
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(SESSION_STORE_NAME)) {
                dbInstance.createObjectStore(SESSION_STORE_NAME, { keyPath: 'sessionId' });
            }
            if (!dbInstance.objectStoreNames.contains(BASELINE_STORE_NAME)) {
                dbInstance.createObjectStore(BASELINE_STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => reject(new Error('IndexedDB error: ' + event.target.errorCode));
    });
};

/**
 * Loads baselines (median/MAD) from IndexedDB. If no baseline data is found,
 * it constructs and returns a fallback baseline from the policy config.
 * @returns {Promise<object>} A promise that resolves with the user's baselines.
 */
export const loadBaselines = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BASELINE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BASELINE_STORE_NAME);
        const request = store.get(BASELINE_KEY);

        request.onsuccess = (event) => {
            if (event.target.result) {
                resolve(event.target.result.data);
            } else {
                // If no baselines, return the fallback from config
                const fallbacks = config.BASELINE_FALLBACKS;
                resolve({
                    RMSSD_MEDIAN: fallbacks.RMSSD_MEDIAN_MS, RMSSD_MAD: fallbacks.RMSSD_MAD_MS,
                    PV_MEDIAN: fallbacks.PV_MEDIAN, PV_MAD: fallbacks.PV_MAD,
                    RESPVAR_MEDIAN: fallbacks.RESPVAR_MEDIAN, RESPVAR_MAD: fallbacks.RESPVAR_MAD,
                    HR_RHR_MEDIAN: fallbacks.HR_RHR_MEDIAN,
                });
            }
        };
        request.onerror = (event) => reject(new Error('Failed to load baselines: ' + event.target.errorCode));
    });
};

/**
 * Writes new session data to IndexedDB and then computes and updates the
 * rolling baselines based on the last N sessions.
 * @param {object} sessionData - The full session data (pre/post metrics).
 * @param {number} N_SESSIONS - The number of recent sessions to use for the rolling calculation.
 * @returns {Promise<boolean>} A promise that resolves to true on success.
 */
export const updateBaselinesAndLogSession = async (sessionData, N_SESSIONS = 7) => {
    const db = await openDB();

    // 1. Write the full sessionData to IndexedDB
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(SESSION_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SESSION_STORE_NAME);
        const request = store.put(sessionData);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(new Error('Failed to log session: ' + event.target.errorCode));
    });

    // 2. Fetch last N_SESSIONS from DB
    const sessions = await new Promise((resolve, reject) => {
        const transaction = db.transaction(SESSION_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SESSION_STORE_NAME);
        const recentSessions = [];
        const cursorRequest = store.openCursor(null, 'prev');
        cursorRequest.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor && recentSessions.length < N_SESSIONS) {
                recentSessions.push(cursor.value);
                cursor.continue();
            } else {
                resolve(recentSessions);
            }
        };
        cursorRequest.onerror = event => reject(new Error('Failed to fetch recent sessions: ' + event.target.errorCode));
    });

    // 3. Compute new rolling median/MAD
    const metrics = { rmssd: [], pv: [], respVar: [], rhr: [] };
    sessions.forEach(s => {
        if (s.rmssdPost) metrics.rmssd.push(s.rmssdPost);
        if (s.pupilPVPost) metrics.pv.push(s.pupilPVPost);
        if (s.respVarPost) metrics.respVar.push(s.respVarPost);
        if (s.rhr) metrics.rhr.push(s.rhr);
    });

    const newBaselines = {
        RMSSD_MEDIAN: calculateMedian(metrics.rmssd), RMSSD_MAD: calculateMAD(metrics.rmssd),
        PV_MEDIAN: calculateMedian(metrics.pv), PV_MAD: calculateMAD(metrics.pv),
        RESPVAR_MEDIAN: calculateMedian(metrics.respVar), RESPVAR_MAD: calculateMAD(metrics.respVar),
        HR_RHR_MEDIAN: calculateMedian(metrics.rhr)
    };

    // 4. Update the stored baselines key
    await new Promise((resolve, reject) => {
        const transaction = db.transaction(BASELINE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BASELINE_STORE_NAME);
        const request = store.put({ id: BASELINE_KEY, data: newBaselines });
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(new Error('Failed to update baselines: ' + event.target.errorCode));
    });

    return true;
};


/**
 * Generates a pseudonymized key for the given data. Required before any optional sync/upload.
 * @param {object} data - The data to be pseudonymized.
 * @returns {object} The data with an added `anonKey`.
 */
export const pseudonymizeData = (data) => {
    // TODO: Implement Argon2id or HMAC(userId + salt) for robust anonKey generation.
    // This is a placeholder for the cryptographic operation.
    const anonKey = 'CLIENT_SIDE_ANON_KEY_STUB_' + new Date().getTime();
    return { anonKey, ...data };
};
