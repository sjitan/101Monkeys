// app/js/decision_engine.js

/**
 * @file Implements the on-device logic for the Pacer Protocol.
 * This engine orchestrates the workflow:
 * 1. Filters protocols based on simple heuristics (for now).
 * 2. Uses a Deep Learning model to find the optimal protocol.
 */

import { getBaselines } from './baseline_store.js';
import { predictUtility } from './dl_engine.js';
import { getCurrentFeatureVector } from './sensor_engine.js';
import { getConfig } from './config_loader.js';

let protocolLibrary = [];
let config = {};
const predictionCache = new Map();
const CACHE_TTL_MS = 5000; // Cache predictions for 5 seconds

/**
 * Loads configuration and protocol library from JSON files.
 */
async function loadDependencies() {
    if (Object.keys(config).length === 0) {
        config = await getConfig();
    }
    if (protocolLibrary.length === 0) {
        try {
            // NOTE: Assuming this file exists based on original implementation.
            const response = await fetch('../config/yoga_protocol_library.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            protocolLibrary = await response.json();
            console.log("DecisionEngine: Protocol library loaded.", protocolLibrary);
        } catch (error) {
            console.error("DecisionEngine: Failed to load protocol library.", error);
        }
    }
}

/**
 * Selects the best adaptive protocol using the DL pipeline.
 * @param {string} userId The ID of the current user, required for federated model selection.
 * @returns {Promise<object>} A promise that resolves with the decision object.
 */
export const getAdaptiveProtocol = async (userId) => {
    await loadDependencies();

    const featureVector = await getCurrentFeatureVector();
    const candidateProtocols = protocolLibrary;

    if (!candidateProtocols || candidateProtocols.length === 0) {
        console.error("DecisionEngine: No candidate protocols available.");
        return getRestorativeProtocol('no_protocols_loaded');
    }

    let bestProtocol = null;
    let maxU = -Infinity;

    // Use Promise.all to run predictions in parallel, improving performance.
    const predictions = await Promise.all(candidateProtocols.map(async (protocol) => {
        const combinedFeatureVector = {
            ...featureVector,
            protocolEffort: protocol.effortScore || 0
        };

        // **FIX:** Implement memoization to avoid redundant predictions.
        const cacheKey = JSON.stringify(combinedFeatureVector);
        const cached = predictionCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
            return { protocol, U: cached.U };
        }

        const U = await predictUtility(combinedFeatureVector, userId);
        predictionCache.set(cacheKey, { U, timestamp: now });
        return { protocol, U };
    }));

    // Clean up expired cache entries periodically
    for (const [key, value] of predictionCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL_MS) {
            predictionCache.delete(key);
        }
    }

    for (const { protocol, U } of predictions) {
        if (U > maxU) {
            maxU = U;
            bestProtocol = protocol;
        }
    }

    if (!bestProtocol) {
        return getRestorativeProtocol('no_suitable_protocol_found');
    }

    console.log(`DecisionEngine: Selected protocol: ${bestProtocol.protocolId} with utility U = ${maxU.toFixed(4)}`);

    return {
        protocolId: bestProtocol.protocolId,
        breath: bestProtocol.breathDefault,
        score: { U: maxU }
    };
};

/**
 * Returns a default restorative protocol.
 * @param {string} reason - The reason for the fallback.
 * @returns {object} The restorative protocol object.
 */
function getRestorativeProtocol(reason = 'default') {
    const restorativeProtocol = protocolLibrary.find(p => p.protocolId === "CHAIR_SAVASANA_NECK_SUPPORT");
    if (restorativeProtocol) {
        return { ...restorativeProtocol, score: { U: 0, reason } };
    }
    return {
        protocolId: "CHAIR_SAVASANA_NECK_SUPPORT",
        breath: { rr: 5.5, ie: 1.8 },
        score: { U: 0, reason }
    };
}

// Initial load
loadDependencies();
