// Decision Engine: Houses the core Pacer Model logic for real-time decision-making.

console.log("Decision Engine Loaded.");

const PacerModel = {
    /**
     * The Core Engine. This is a placeholder for the sequential deep learning model (GRU-based)
     * that will run on-device via TensorFlow.js.
     *
     * It takes a hardened, z-normalized feature vector F_t as input and outputs a Utility Score (U).
     *
     * The feature vector F_t is defined as:
     * F_t = [
     *     z(PV_sequence),
     *     ocular_fidelity,
     *     z(sEDA),
     *     z(RF_RespRate),
     *     rf_fidelity,
     *     z(RF_Bracing),
     *     z(GazeStability)
     * ]
     *
     * @param {object} featureVector - The input feature vector F_t.
     * @returns {number} - A predicted "Utility Score" (U) between 0 and 1.
     */
    computeUtility: (featureVector) => {
        if (!featureVector) {
            console.error("PacerModel requires a featureVector.");
            return 0;
        }

        const {
            z_pv_sequence,
            ocular_fidelity,
            z_seda,
            z_rf_resprate,
            rf_fidelity,
            z_rf_bracing,
            z_gaze_stability
        } = featureVector;

        // --- Placeholder Model Logic ---
        // In a real implementation, this section would be replaced with a call to a loaded TensorFlow.js model:
        // const model = await tf.loadLayersModel('app/tfl/cluster_A/model.json');
        // const inputTensor = tf.tensor2d([Object.values(featureVector)]);
        // const prediction = model.predict(inputTensor);
        // const utilityScore = await prediction.data();
        // return utilityScore[0];

        // For now, we use a simple weighted heuristic to simulate the model's logic.
        // This heuristic prioritizes low sympathetic arousal (low PV, sEDA, bracing) and high signal quality.
        const weights = {
            pv: -0.3,      // High PV is bad
            seda: -0.3,    // High sEDA is bad
            bracing: -0.4, // High bracing is very bad
            gaze: 0.1,     // High gaze stability is good
            resprate: 0.05 // Small bonus for stable breathing
        };

        // The fidelity scores act as multipliers for their respective signals.
        const weightedSum =
            (z_pv_sequence * ocular_fidelity * weights.pv) +
            (z_seda * weights.seda) + // sEDA is derived from PV, so it implicitly uses ocular_fidelity
            (z_rf_bracing * rf_fidelity * weights.bracing) +
            (z_gaze_stability * ocular_fidelity * weights.gaze) +
            (z_rf_resprate * rf_fidelity * weights.resprate);

        // Normalize the result to a "utility score" between 0 and 1 using a sigmoid function.
        const utilityScore = 1 / (1 + Math.exp(-weightedSum));

        return utilityScore;
    },

    /**
     * Helper function to compute a z-score.
     * @param {number} value - The current value.
     * @param {number} mean - The mean of the baseline distribution.
     * @param {number} stdDev - The standard deviation of the baseline distribution.
     * @returns {number} - The z-score.
     */
    normalizeZScore: (value, mean, stdDev) => {
        if (stdDev === 0) {
            return 0; // Avoid division by zero
        }
        return (value - mean) / stdDev;
    }
};

// --- Example Usage ---
// Simulate a "good" state: low arousal, high fidelity
const goodFeatureVector = {
    z_pv_sequence: -0.8,    // Low pupil variability
    ocular_fidelity: 0.95,  // High quality signal
    z_seda: -0.7,           // Low synthetic EDA
    z_rf_resprate: 0.1,     // Stable breathing
    rf_fidelity: 0.9,       // High quality signal
    z_rf_bracing: -0.5,     // No flinch
    z_gaze_stability: 1.2   // High focus
};

const utility_good = PacerModel.computeUtility(goodFeatureVector);
console.log(`Computed Utility Score (Good State): ${utility_good.toFixed(3)}`); // Expect a high score

// Simulate a "bad" state: high arousal (flinch), low fidelity
const badFeatureVector = {
    z_pv_sequence: 1.5,     // High pupil variability
    ocular_fidelity: 0.6,   // Low quality signal
    z_seda: 1.8,            // High synthetic EDA
    z_rf_resprate: -0.5,    // Erratic breathing
    rf_fidelity: 0.5,       // Low quality signal
    z_rf_bracing: 2.5,      // Strong flinch detected
    z_gaze_stability: -1.0  // Low focus
};

const utility_bad = PacerModel.computeUtility(badFeatureVector);
console.log(`Computed Utility Score (Bad State): ${utility_bad.toFixed(3)}`); // Expect a low score