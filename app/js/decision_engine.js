/**
 * @file decision_engine.js
 * @description Implements the final core on-device logic for the Pacer Protocol.
 * This engine orchestrates the workflow:
 * 1. Checks hard-coded safety gates.
 * 2. Filters protocols using objective effort (E_obj) from CV.
 * 3. Uses a Deep Learning model to find the optimal protocol.
 */

import { loadBaselines } from './baseline_store.js';
import { predictPacingUtility } from './dl_engine.js';
import { createFeatureVector, calculateObjectiveEffort } from './sensor_engine.js'; // Import new sensor functions
import config from './policy_config.json';
import protocolLibrary from './yoga_protocol_library.json';

const THRESHOLDS = config.SAFETY_THRESHOLDS;
const FALLBACKS = config.BASELINE_FALLBACKS;

// Helper to compute Z-score for safety gates
const computeZScore = (value, metric, baselines) => {
    const median = baselines[`${metric}_MEDIAN`] || FALLBACKS[`${metric}_MEDIAN`];
    const mad = baselines[`${metric}_MAD`] || FALLBACKS[`${metric}_MAD`];
    if (mad < 0.001 || median === undefined || mad === undefined) return 0;
    return (value - median) / mad;
};

// 1. The Real-Time Safety Gate Loop (sub-minute)
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


// 2. The Slow Adaptive Decision Loop (2-3 minutes)
/**
 * Selects the best adaptive protocol using the full CV/DL pipeline.
 * @param {object} currentMetrics - The latest snapshot of sensor data.
 * @param {Array<object>} historicalData - A time-series of recent sensor data snapshots for the GRU model.
 * @param {object} videoFrame - The current video frame for CV analysis.
 * @returns {Promise<object>} A promise that resolves with the decision object.
 */
export const getAdaptiveProtocol = async (currentMetrics, historicalData, videoFrame) => {
    const baselines = await loadBaselines();

    // STEP A: Always check hard safety gates first.
    const safetyResult = checkSafetyGates(currentMetrics, baselines);
    if (!safetyResult.isSafe) {
        console.warn('SAFETY GATE BREACHED. Reverting to restorative protocol.', safetyResult.gates);
        return getRestorativeProtocol('safety_gate_breach');
    }

    // STEP B: Get Objective Effort from CV to determine user's current capacity.
    const { effort: objectiveEffort } = await calculateObjectiveEffort(videoFrame);
    const userCapacity = 1 - objectiveEffort; // Example: capacity is inverse of current effort/strain.

    // STEP C: Filter candidate protocols based on objective capacity.
    const candidateProtocols = protocolLibrary.filter(p => p.effort <= userCapacity * 3); // Scale capacity to effort score

    let bestProtocol = null;
    let maxU = -Infinity;

    // STEP D: Create the time-series feature vector required by the GRU model.
    const timeSeriesFeatureVector = historicalData.map(dataPoint => createFeatureVector(dataPoint, baselines));


    // STEP E: For each candidate, get a utility prediction from the DL model.
    for (const protocol of candidateProtocols) {
        // In a more advanced version, protocol features would be appended to the feature vector.
        // For now, we use the same vector for all candidates as a baseline.
        const U = await predictPacingUtility(timeSeriesFeatureVector);

        if (U > maxU) {
            maxU = U;
            bestProtocol = {
                ...protocol,
                score: { U: maxU }
            };
        }
    }

    if (!bestProtocol) {
        return getRestorativeProtocol('no_suitable_protocol_found');
    }

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
