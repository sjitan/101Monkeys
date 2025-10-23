// sEDA Model: Generates a synthetic Electrodermal Activity (sEDA) score.

console.log("sEDA Model Loaded.");

const SEDAModel = {
    /**
     * Computes a synthetic EDA score based on pupil variability and thermal data sequences.
     * This acts as the primary sympathetic nervous system proxy.
     *
     * @param {number[]} pvSequence - An array representing the "movie" of pupil variability over time.
     * @param {number[]} thermalSequence - An array representing the phone's thermal sensor readings over time.
     * @returns {number} - A single sEDA_score representing sympathetic arousal.
     */
    compute: (pvSequence, thermalSequence) => {
        if (!pvSequence || pvSequence.length === 0 || !thermalSequence || thermalSequence.length === 0) {
            console.warn("sEDA model requires non-empty pvSequence and thermalSequence.");
            return 0;
        }

        // Placeholder logic: In a real implementation, this would be a trained model.
        // For now, we'll simulate a score based on the average of both sequences.
        const avgPv = pvSequence.reduce((a, b) => a + b, 0) / pvSequence.length;
        const avgThermal = thermalSequence.reduce((a, b) => a + b, 0) / thermalSequence.length;

        // Simple heuristic: higher pupil variability and higher temperature suggest higher arousal.
        const score = (avgPv + avgThermal) / 2;

        return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
    }
};

// --- Example Usage ---
const examplePvSequence = [0.4, 0.5, 0.45, 0.6, 0.55];
const exampleThermalSequence = [31.2, 31.3, 31.5, 31.4, 31.6];
const sEDA_score = SEDAModel.compute(examplePvSequence, exampleThermalSequence);
console.log(`Computed sEDA Score: ${sEDA_score}`);