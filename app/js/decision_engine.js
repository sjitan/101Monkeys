import { loadBaselines } from './baseline_store.js';
import config from './policy_config.json';
// Assume pose library is loaded from a static JSON file or imported

const W = config.POLICY_WEIGHTS;
const THRESHOLDS = config.SAFETY_THRESHOLDS;
const FALLBACKS = config.BASELINE_FALLBACKS;

// Helper to compute Z-score based on local baselines
const computeZScore = (value, metric, baselines) => {
    const median = baselines[`${metric}_MEDIAN`] || FALLBACKS[`${metric}_MEDIAN`];
    const mad = baselines[`${metric}_MAD`] || FALLBACKS[`${metric}_MAD`];
    // Avoid division by zero, return 0 if MAD is too small/zero (i.e., stable signal = no change)
    if (mad < 0.001) return 0;
    return (value - median) / mad;
};

// 1. The Real-Time Safety Gate Loop (sub-minute)
export const checkSafetyGates = (currentMetrics, baselines) => {
    const zPV = computeZScore(currentMetrics.pupilPV, 'PV', baselines);
    const rmssdZ = computeZScore(currentMetrics.rmssd, 'RMSSD', baselines);
    const hrDelta = currentMetrics.hr - (baselines.HR_RHR_MEDIAN || FALLBACKS.HR_RHR_MEDIAN);

    const gates = {
        hr: hrDelta <= THRESHOLDS.HR_GATE_BPM_OVER_RHR,
        pv: zPV <= THRESHOLDS.PV_COMPLEXITY_GATE_MAD,
        pem: currentMetrics.pemScore < THRESHOLDS.PEM_MAX_SCORE,
        // Check for RMSSD trend drop locally (this requires checking IndexedDB history, or a simplified check)
        rmssdTrend: rmssdZ > -computeZScore(THRESHOLDS.RMSSD_TREND_DROP_PCT / 100 * baselines.RMSSD_MEDIAN, 'RMSSD', baselines)
    };

    const isSafe = Object.values(gates).every(g => g === true);
    return { isSafe, gates };
};


// 2. The Slow Adaptive Decision Loop (2-3 minutes)
export const getAdaptiveProtocol = async (preProtocolMetrics) => {
    const baselines = await loadBaselines();

    // SQM Gating: assume this comes from sensor_engine.js
    const SQM_RMSSD = preProtocolMetrics.rmssdSQM;
    const SQM_PV = preProtocolMetrics.pupilPVSQM;

    // Apply SQM check to weights (auto-zero if signal quality is low)
    const w_rmssd_adj = SQM_RMSSD < 0.7 ? 0 : W.w_rmssd;
    const w_pv_adj = SQM_PV < 0.7 ? 0 : W.w_pv;

    // Compute Z-scores for S formula inputs
    const zRMSSD = 0; // Use expected RMSSD delta, or prior session delta (for v1 MVP, assume expected=0 or use last log)
    const zPV = computeZScore(preProtocolMetrics.pupilPV, 'PV', baselines);
    const zRespVar = computeZScore(preProtocolMetrics.respVar, 'RESPVAR', baselines);
    const zRespRateErr = Math.abs(computeZScore(preProtocolMetrics.respRate, 'RESPRATE_TARGET', baselines));
    const zFatigue = computeZScore(preProtocolMetrics.fatigue, 'FATIGUE_ADJ', baselines);

    // Placeholder: Iterate through ALL protocols/poses from the local library
    const candidateProtocols = []; // Load from local pose JSON
    let bestProtocol = null;
    let maxS = -Infinity;

    for (const protocol of candidateProtocols) {
        // Step A: Check safety gates (using real-time metrics)
        const safetyResult = checkSafetyGates(preProtocolMetrics, baselines);
        if (!safetyResult.isSafe) continue;
        if (protocol.EffortScore > preProtocolMetrics.userCapacity) continue;

        // Step B: Compute Utility Score S
        // (RMSSD delta expected/recent is complex, use 0 for now until empirical data is logged)
        const S = (w_rmssd_adj * zRMSSD) -
                  (w_pv_adj * zPV) -
                  (W.w_respvar * zRespVar) -
                  (W.w_resprate_error * zRespRateErr) -
                  (W.w_fatigue * zFatigue);

        if (S > maxS && S > 0) {
            maxS = S;
            bestProtocol = protocol;
        }
    }

    if (!bestProtocol) {
        // Fallback: Restorative Savasana on Chair (Effort=0)
        return { protocolId: "CHAIR_SAVASANA_NECK_SUPPORT", score: { S: 0 } };
    }

    return {
        protocolId: bestProtocol.ProtocolID,
        breath: bestProtocol.BreathDefault, // Simplified for MVP
        score: { S: maxS, z_rmssd: zRMSSD, z_pv: zPV }
    };
};
