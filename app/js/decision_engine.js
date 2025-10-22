/**
 * @file decision_engine.js
 * @description Implements the core on-device logic for the Pacer Protocol.
 * This engine uses a Deep Learning model to find the optimal protocol,
 * after applying a series of hard-coded safety gates.
 */

import { loadBaselines } from './baseline_store.js';
import { predictPacingUtility } from './dl_engine.js'; // Import the new DL engine
import config from './policy_config.json';
import protocolLibrary from './yoga_protocol_library.json';

const THRESHOLDS = config.SAFETY_THRESHOLDS;
const FALLBACKS = config.BASELINE_FALLBACKS;

// Helper to compute Z-score for safety gates
const computeZScore = (value, metric, baselines) => {
    const median = baselines[`${metric}_MEDIAN`] || FALLBACKS[`${metric}_MEDIAN`];
    const mad = baselines[`${metric}_MAD`] || FALLBACKS[`${metric}_MAD`];
    if (mad < 0.001) return 0;
    return (value - median) / mad;
};

// 1. The Real-Time Safety Gate Loop (sub-minute)
// This remains the first line of defense, checked before any DL model prediction.
export const checkSafetyGates = (currentMetrics, baselines) => {
    const zPV = computeZScore(currentMetrics.pupilPV, 'PV', baselines);
    const hrDelta = currentMetrics.hr - (baselines.HR_RHR_MEDIAN || FALLBACKS.HR_RHR_MEDIAN);

    const gates = {
        hr: hrDelta <= THRESHOLDS.HR_GATE_BPM_OVER_RHR,
        pv: zPV <= THRESHOLDS.PV_COMPLEXITY_GATE_MAD,
        pem: currentMetrics.pemScore < THRESHOLDS.PEM_MAX_SCORE,
    };

    const isSafe = Object.values(gates).every(g => g === true);
    return { isSafe, gates };
};


// 2. The Slow Adaptive Decision Loop (2-3 minutes) - NOW USES THE DL MODEL
/**
 * Selects the best adaptive protocol by checking safety gates and then using a GRU model
 * to predict the utility (U) of each candidate protocol.
 *
 * @param {object} currentMetrics - The latest snapshot of sensor data.
 * @param {Array<object>} historicalMetrics - A time-series of recent sensor data, matching the model's expected input shape.
 * @returns {Promise<object>} A promise that resolves with the decision object.
 */
export const getAdaptiveProtocol = async (currentMetrics, historicalMetrics) => {
    const baselines = await loadBaselines();

    // STEP A: ALWAYS check hard safety gates first.
    const safetyResult = checkSafetyGates(currentMetrics, baselines);
    if (!safetyResult.isSafe) {
        console.warn('SAFETY GATE BREACHED. Reverting to restorative protocol.', safetyResult.gates);
        return getRestorativeProtocol('safety_gate_breach');
    }

    // STEP B: Filter candidate protocols based on user capacity, etc.
    const candidateProtocols = protocolLibrary.filter(p => p.effort <= (currentMetrics.userCapacity || 3));

    let bestProtocol = null;
    let maxU = -Infinity;

    // STEP C: For each candidate, get a utility prediction from the DL model.
    for (const protocol of candidateProtocols) {
        // Create the feature vector for the model.
        // This is a simplified example. In a real implementation, this vector
        // would be carefully constructed to match the model's training data,
        // potentially including the protocol's characteristics (e.g., effort, type)
        // appended to each timestep.
        const featureVector = historicalMetrics.map(metrics => [
            metrics.rmssd || 0,
            metrics.hr || 0,
            metrics.pupilPV || 0,
            metrics.respVar || 0,
            protocol.effort // Example of including a protocol feature
        ]);

        // Get the utility score 'U' from the DL model.
        const U = await predictPacingUtility(featureVector);

        if (U > maxU) {
            maxU = U;
            bestProtocol = {
                ...protocol,
                score: { U: maxU }
            };
        }
    }

    if (!bestProtocol) {
        // Fallback: Restorative Savasana on Chair (Effort=0)
        return getRestorativeProtocol('no_suitable_protocol_found');
    }

    // Apply tie-breakers if necessary (less likely with float U scores)
    // ...

    return {
        protocolId: bestProtocol.protocolId,
        breath: bestProtocol.breathDefault,
        score: bestProtocol.score
    };
};

/**
 * Returns a default restorative protocol.
 * @param {string} reason - The reason for the fallback.
 * @returns {object} The restorative protocol object.
 */
function getRestorativeProtocol(reason = 'default') {
    return {
        protocolId: "CHAIR_SAVASANA_NECK_SUPPORT",
        score: { U: 0, reason }
    };
}
