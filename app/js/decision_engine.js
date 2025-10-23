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

/**
 * Loads configuration and protocol library from JSON files.
 */
async function loadDependencies() {
    if (Object.keys(config).length === 0) {
        config = await getConfig();
    }
    if (protocolLibrary.length === 0) {
        try {
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
 * @returns {Promise<object>} A promise that resolves with the decision object.
 */
export const getAdaptiveProtocol = async () => {
    await loadDependencies();

    const featureVector = await getCurrentFeatureVector();

    // In a future version, we would filter protocols based on user capacity.
    // For now, we consider all protocols as candidates.
    const candidateProtocols = protocolLibrary;

    if (!candidateProtocols || candidateProtocols.length === 0) {
        console.error("DecisionEngine: No candidate protocols available.");
        return getRestorativeProtocol('no_protocols_loaded');
    }

    let bestProtocol = null;
    let maxU = -Infinity;

    // For each candidate, get a utility prediction from the DL model.
    for (const protocol of candidateProtocols) {
        // The current feature vector represents the user's state. The model
        // predicts the utility of *any* intervention given this state.
        // A more advanced model would take protocol features as input as well.
        const U = await predictUtility(featureVector);

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
        return {
            ...restorativeProtocol,
            score: { U: 0, reason }
        };
    }
    // Fallback if the library is empty or the specific protocol is missing
    return {
        protocolId: "CHAIR_SAVASANA_NECK_SUPPORT",
        breath: { rr: 5.5, ie: 1.8 },
        score: { U: 0, reason }
    };
}

// Initial load
loadDependencies();
