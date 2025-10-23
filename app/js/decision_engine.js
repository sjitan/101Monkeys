// Decision Engine: Fully integrated to handle sequential data and the federated learning loop.

import { BaselineStore } from './baseline_store.js';
import { ProtocolLibrary } from './protocol_library.js';
import { FederatedManager } from './federated_manager.js';
import { sensorEngine } from './sensor_engine.js'; // Correctly import sensorEngine

console.log("Decision Engine (Fully Integrated with Sequences & FL) Loaded.");

// --- Sequential Pacer_Model Placeholder ---
const Pacer_Model = {
    computeUtility: (ft_sequence) => {
        // ... (heuristic logic from previous step)
        if (!ft_sequence || ft_sequence.length === 0) return 0;
        const last_ft = ft_sequence[ft_sequence.length - 1];
        const first_ft = ft_sequence[0];
        const [ o,m,r, z_rmssd, d_rmssd, pv, d_pv, therm, seda, brace, micro, ...rest ] = last_ft;
        return 1 / (1 + Math.exp(-(z_rmssd * 0.5 - seda * 0.3 - brace * 0.2)));
    },
    constructFeatureVector: (sensorData, baselines) => {
        // This function now correctly passes sequences for PV and Thermal
        return [
            sensorData.ocular_fidelity, sensorData.mic_fidelity, sensorData.rf_fidelity,
            BaselineStore.normalizeRobustZScore(sensorData.rmssd, baselines.rmssd),
            BaselineStore.normalizeRobustZScore(sensorData.delta_rmssd, baselines.delta_rmssd),
            sensorData.pv_sequence, // Preserved as a sequence
            BaselineStore.normalizeRobustZScore(sensorData.delta_pv, baselines.delta_pv),
            sensorData.thermal_sequence, // Preserved as a sequence
            BaselineStore.normalizeRobustZScore(sensorData.seda, baselines.seda),
            BaselineStore.normalizeRobustZScore(sensorData.rf_bracing, baselines.rf_bracing),
            BaselineStore.normalizeRobustZScore(sensorData.micro_expression_trigger, baselines.micro_expression_trigger),
            BaselineStore.normalizeRobustZScore(sensorData.resp_var, baselines.resp_var),
            BaselineStore.normalizeRobustZScore(sensorData.resp_rate_error, baselines.resp_rate_error),
            BaselineStore.normalizeRobustZScore(sensorData.rf_resp_rate, baselines.rf_resp_rate),
            BaselineStore.normalizeRobustZScore(sensorData.gaze_stability, baselines.gaze_stability),
            BaselineStore.normalizeRobustZScore(sensorData.blink_rate, baselines.blink_rate),
            BaselineStore.normalizeRobustZScore(sensorData.fatigue, baselines.fatigue)
        ];
    }
};

// --- Main Application Flow Manager ---
export class PacerSessionManager {
    constructor(userId, userBaselines) {
        this.userId = userId;
        this.userBaselines = userBaselines;
        this.userArchetype = null;
        this.protocol = null;
        this.sessionInterval = null;
        this.ft_sequence = []; // Stores the sequence of feature vectors
        this.SEQUENCE_LENGTH = 10; // The model expects sequences of this length
    }

    async initialize(userPerformanceMetrics) {
        console.log(`Initializing session for user ${this.userId}...`);
        this.userArchetype = await FederatedManager.getArchetypeAssignment(
            this.userId, userPerformanceMetrics.vae_score, userPerformanceMetrics.nsf_score
        );
        this.protocol = ProtocolLibrary.getProtocol(this.userArchetype);
        console.log(`User archetype is '${this.userArchetype}'. Loaded protocol: '${this.protocol.name}'`);
    }

    startPacerSession() {
        if (!this.protocol) { console.error("Session not initialized."); return; }
        console.log(`--- Starting Pacer Session: ${this.protocol.name} ---`);

        this.sessionInterval = setInterval(() => {
            const sensorData = SensorEngine.getAllFeatures();
            const ft_vector = Pacer_Model.constructFeatureVector(sensorData, this.userBaselines);

            // Add the new vector to the sequence and maintain its length
            this.ft_sequence.push(ft_vector);
            if (this.ft_sequence.length > this.SEQUENCE_LENGTH) {
                this.ft_sequence.shift(); // Remove the oldest vector
            }

            // Only compute utility if we have a full sequence
            if (this.ft_sequence.length === this.SEQUENCE_LENGTH) {
                const utilityScore = Pacer_Model.computeUtility(this.ft_sequence);
                const decision = utilityScore > 0.5 ? "CONTINUE_PROTOCOL" : "RECOMMEND_REST";
                console.log(`[${new Date().toLocaleTimeString()}] Utility: ${utilityScore.toFixed(3)} (Sequence of ${this.ft_sequence.length}) -> Decision: ${decision}`);
            } else {
                console.log(`[${new Date().toLocaleTimeString()}] Collecting data... (${this.ft_sequence.length}/${this.SEQUENCE_LENGTH})`);
            }
        }, 1000); // Run every second to gather sequences faster

        setTimeout(() => this.stopPacerSession(), 15000); // Run for 15 seconds
    }

    stopPacerSession() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
            this.sessionInterval = null;
            console.log("--- Pacer Session Stopped ---");

            // After the session, simulate on-device training and send the anonymized report.
            const mockTrainingResult = { loss: Math.random() * 0.2, accuracy: 0.9 };
            FederatedManager.prepareAnonymizedReport(mockTrainingResult, this.userBaselines);
        }
    }
}

/**
 * Performs a "Fast Triage" to determine the user's current state and recommend an initial protocol.
 * This is a synchronous, one-off check, unlike the continuous PacerSessionManager.
 * @returns {{archetype: string, state: string, audioProtocol: string}} A decision object.
 */
function runFastTriage() {
    console.log("[DecisionEngine] Running Fast Triage...");
    // 1. Get current user archetype (simulated for this example)
    // In a real app, this would be fetched from a user profile service.
    const archetypes = ['Amplifier', 'Insulated'];
    const userArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    // 2. Get a single, current feature vector.
    // We need baselines to compute the z-scores.
    const baselines = BaselineStore.getMockUserBaselines(); // Corrected function name
    const sensorData = sensorEngine.getMockFeatures(); // Use mock features for triage
    const ft_vector = Pacer_Model.constructFeatureVector(sensorData, baselines);
    const z_rmssd = ft_vector[3];
    const sEDA = ft_vector[8];

    let state;
    let audioProtocol;

    // 3. Make a decision based on a simple heuristic.
    if (userArchetype === 'Amplifier') {
        // Amplifiers are prone to high-sympathetic states.
        if (sEDA > 1.5) {
            state = 'High-Sympathetic';
            audioProtocol = 'dojo_amplifier/warmup_gating_03.mp3';
        } else {
            state = 'Stable';
            // A different protocol could be chosen for a stable state.
            audioProtocol = 'dojo_amplifier/warmup_gating_03.mp3'; // Default for now
        }
    } else { // 'Insulated'
        // Insulated users might be in a low-vagal state.
        if (z_rmssd < -1.0) {
            state = 'Low-Vagal';
            audioProtocol = 'dojo_insulated/warmup_activation_01.mp3';
        } else {
            state = 'Stable';
            audioProtocol = 'dojo_insulated/warmup_activation_01.mp3'; // Default for now
        }
    }

    const decision = { userArchetype, state, audioProtocol };
    console.log(`[DecisionEngine] Triage complete. Decision:`, decision);
    return decision;
}

export const decisionEngine = {
    runFastTriage,
};
