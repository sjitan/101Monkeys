// Sensor Engine: Mocks the full sensor stack for the "Jules-Hardened" architecture.

console.log("Sensor Engine (Full Stack Mock) Loaded.");

export const SensorEngine = {
    // Generates a single snapshot of all sensor data.
    getAllFeatures: () => {
        return {
            // Fidelity Scores
            ocular_fidelity: 0.9 + Math.random() * 0.1,
            mic_fidelity: 0.85 + Math.random() * 0.15,
            rf_fidelity: 0.92 + Math.random() * 0.08,

            // Vagal (Heart)
            rmssd: 50 + Math.random() * 20 - 10,
            delta_rmssd: Math.random() * 4 - 2,

            // Sympathetic (Arousal)
            pv_sequence: Array.from({ length: 5 }, () => Math.random() * 0.2), // Sequence data
            delta_pv: Math.random() * 0.1 - 0.05,
            thermal_sequence: Array.from({ length: 5 }, () => 34 + Math.random()), // Sequence data
            seda: Math.random() * 0.5,

            // Motor "Flinch"
            rf_bracing: Math.random() * 0.1,
            micro_expression_trigger: Math.random() > 0.95 ? 1 : 0,

            // Respiratory (Coherence & Adherence)
            resp_var: 0.3 + Math.random() * 0.2,
            resp_rate_error: Math.random() - 0.5,
            rf_resp_rate: 16 + Math.random(),

            // Cognitive (Fatigue & Adherence)
            gaze_stability: 0.95 + Math.random() * 0.05,
            blink_rate: 18 + Math.random() * 4,
            fatigue: 3 + Math.random() * 3
        };
    }
};
