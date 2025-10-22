/**
 * @file decision_engine.js
 * @description Implements the core on-device logic for the Pacer Protocol.
 * This engine calculates the composite utility score (S), applies safety gates,
 * and selects the optimal, lowest-effort protocol for the user in real-time.
 * It operates entirely offline, using data from the baseline_store.
 */

import { getCurrentBaseline } from './baseline_store.js';
import policy from './policy_config.json';
import protocolLibrary from './yoga_protocol_library.json';

/**
 * Calculates a z-score for a given value against a baseline using robust statistics.
 * @param {number} value - The current physiological metric value.
 * @param {object} baseline - The baseline object, e.g., { median: 25.0, mad: 5.0 }.
 * @returns {number|null} The calculated z-score, or null if baseline is invalid.
 */
function calculateZScore(value, baseline) {
    if (!baseline || typeof baseline.median !== 'number' || typeof baseline.mad !== 'number' || baseline.mad === 0) {
        return 0; // Return a neutral score if baseline is incomplete or MAD is zero
    }
    return (value - baseline.median) / baseline.mad;
}

/**
 * The main decision function. It takes the latest sensor data and user inputs,
 * evaluates them against the user's baselines and the policy config, and returns
 * the best protocol choice.
 *
 * @param {object} sensorData - The latest package of sensor data.
 *   Example: {
 *     rmssd: 22.3, rmssd_sqm: 0.86,
 *     respRate: 6.1, respVar: 0.08,
 *     pupilPV: 0.12, pupil_sqm: 0.72,
 *     fatigue: 5, pemScore: 1, rhr: 62, hr: 68
 *   }
 * @returns {Promise<object>} A promise that resolves with the decision object.
 *   Example: {
 *     protocolId: "SEATED_UTTANASANA_SOFT",
 *     rationale: { S: 1.92, ... },
 *     ...
 *   }
 */
async function selectProtocol(sensorData) {
    const baseline = await getCurrentBaseline();
    // A seed baseline should be used if no baseline is present
    const userBaseline = baseline || getSeedBaseline();

    // 1. APPLY SAFETY GATES (Fast loop concerns handled here before scoring)
    // HR Gate
    if (sensorData.hr > (sensorData.rhr + policy.gates.hr_delta_bpm_max)) {
        console.warn('SAFETY GATE: HR breach detected.');
        return getRestorativeProtocol('hr_gate_breach');
    }
    // PEM Score Gate
    if (sensorData.pemScore >= 2) {
        console.warn('SAFETY GATE: High PEM score reported.');
        return getRestorativeProtocol('pem_score_high');
    }
    // RMSSD Trend Gate (Requires historical baseline data not shown in this stub)
    // This would involve comparing the 7-day median to a longer-term (e.g., 28-day) median.
    // For now, we assume this check passes.


    // 2. FILTER PROTOCOL LIBRARY
    // Filter by effort based on subjective fatigue and objective gates
    let maxEffort = 3;
    if (sensorData.fatigue > 7) maxEffort = 1;
    if (sensorData.fatigue > 5) maxEffort = 2;
    // Further cap effort if PEM gate is tripped
    // if(isPemGateTripped) maxEffort = 1;

    const candidateProtocols = protocolLibrary.filter(p => p.effort <= maxEffort);


    // 3. CALCULATE S-SCORE FOR EACH CANDIDATE
    const scoredProtocols = candidateProtocols.map(protocol => {
        const effectiveWeights = { ...policy.weights };

        // Handle missing signals based on SQM
        if (!sensorData.rmssd || sensorData.rmssd_sqm < policy.quality.ppg_sqm_min) {
            effectiveWeights.w_rmssd = 0;
        }
        if (!sensorData.pupilPV || sensorData.pupil_sqm < policy.quality.pupil_sqm_min) {
            effectiveWeights.w_pv = 0;
        }
        // Could re-normalize weights here if desired

        // Calculate z-score terms
        const z_rmssdDelta_expected = calculateZScore(protocol.rmssdDeltaSeed, { median: 0, mad: 1 }); // Simplified for stub
        const z_pupilPV = calculateZScore(sensorData.pupilPV, userBaseline.pupilPV);
        const z_respVar = calculateZScore(sensorData.respVar, userBaseline.respVar);
        const z_resprate_dev = Math.abs(sensorData.respRate - (protocol.breathDefault.rf_bpm || policy.breath.rf_bpm_max));
        const z_fatigueAdj = calculateZScore(sensorData.fatigue, { median: 3, mad: 2 }); // Example baseline for fatigue

        // Calculate final S-score
        const S = (effectiveWeights.w_rmssd * z_rmssdDelta_expected) -
                  (effectiveWeights.w_pv * z_pupilPV) -
                  (effectiveWeights.w_respvar * z_respVar) -
                  (effectiveWeights.w_resprate * z_resprate_dev) -
                  (effectiveWeights.w_fatigue * z_fatigueAdj);

        return {
            ...protocol,
            S,
            rationale: {
                S,
                terms: { z_rmssdDelta_expected, z_pupilPV, z_respVar, z_resprate_dev, z_fatigueAdj },
                weights_used: effectiveWeights
            }
        };
    });


    // 4. APPLY TIE-BREAKER RULES AND SELECT BEST PROTOCOL
    const validProtocols = scoredProtocols.filter(p => p.S > 0);

    if (validProtocols.length === 0) {
        console.warn('No protocols with positive S-score. Defaulting to restorative.');
        return getRestorativeProtocol('no_positive_s_score');
    }

    validProtocols.sort((a, b) => {
        // 1. Highest S
        if (a.S !== b.S) return b.S - a.S;
        // 2. Lower Effort
        if (a.effort !== b.effort) return a.effort - b.effort;
        // 3. Deterministic lexical order
        return a.protocolId.localeCompare(b.protocolId);
    });

    return validProtocols[0];
}

/**
 * Returns a default restorative protocol when a safety gate is breached or no suitable protocol is found.
 * @param {string} reason - The reason for returning a restorative protocol.
 * @returns {object} The restorative protocol object.
 */
function getRestorativeProtocol(reason = 'default') {
    const restorative = protocolLibrary.find(p => p.protocolId === 'CHAIR_SAVASANA_NECK_SUPPORT');
    return {
        ...restorative,
        rationale: {
            S: 0,
            reason: `Safety fallback triggered: ${reason}`,
            terms: {},
            weights_used: {}
        }
    };
}

/**
 * Provides a default/seed baseline for new users without sufficient session history.
 * @returns {object} A seed baseline object.
 */
function getSeedBaseline() {
    return {
        rmssd: { median: 30, mad: 8 },
        respVar: { median: 0.1, mad: 0.05 },
        pupilPV: { median: 0.15, mad: 0.05 },
    };
}


export {
    selectProtocol
};
