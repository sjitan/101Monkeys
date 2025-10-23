// Baseline Store: Manages the calculation and storage of robust physiological baselines.
// Uses Median and Median Absolute Deviation (MAD) for clinical-grade robustness.

console.log("Baseline Store Loaded.");

export const BaselineStore = {
    /**
     * Calculates the median of an array of numbers.
     * @param {Array<number>} arr - An array of numbers.
     * @returns {number} The median.
     */
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    /**
     * Calculates the Median Absolute Deviation (MAD) of an array of numbers.
     * @param {Array<number>} arr - An array of numbers.
     * @returns {number} The MAD.
     */
    calculateMAD(arr) {
        if (arr.length === 0) return 0;
        const median = this.calculateMedian(arr);
        const deviations = arr.map(x => Math.abs(x - median));
        return this.calculateMedian(deviations);
    },

    /**
     * Generates a complete set of mock baselines for a user.
     * In a real application, this data would be loaded from IndexedDB.
     * @returns {object} A dictionary of baselines for each physiological metric.
     */
    getMockUserBaselines() {
        // These values simulate a user's long-term physiological profile.
        return {
            rmssd: { median: 48, mad: 7 }, delta_rmssd: { median: 0, mad: 1.5 },
            pv_sequence: { median: 0.18, mad: 0.04 }, delta_pv: { median: 0, mad: 0.04 },
            thermal_sequence: { median: 34.2, mad: 0.4 }, seda: { median: 0.35, mad: 0.1 },
            rf_bracing: { median: 0.04, mad: 0.03 }, micro_expression_trigger: { median: 0.0, mad: 0.1 },
            resp_var: { median: 0.28, mad: 0.08 }, resp_rate_error: { median: 0, mad: 0.4 },
            rf_resp_rate: { median: 15.8, mad: 1.2 }, gaze_stability: { median: 0.96, mad: 0.04 },
            blink_rate: { median: 19, mad: 3 }, fatigue: { median: 4.5, mad: 1.0 }
        };
    },

    /**
     * Z-normalizes a value using the robust median and MAD.
     * @param {number} value - The raw sensor value.
     * @param {object} baseline - An object with { median, mad }.
     * @returns {number} The robust z-score.
     */
    normalizeRobustZScore(value, baseline) {
        if (!baseline || baseline.mad === 0) {
            return 0; // Avoid division by zero and handle missing baselines.
        }
        // The 0.6745 is a scaling factor to make MAD comparable to standard deviation for normal distributions.
        return (value - baseline.median) / (baseline.mad / 0.6745);
    }
};

// --- Example Usage ---
const pastRMSSD = [45, 47, 48, 52, 53, 55, 56];
const median = BaselineStore.calculateMedian(pastRMSSD);
const mad = BaselineStore.calculateMAD(pastRMSSD);
console.log(`Example RMSSD Data: Median=${median}, MAD=${mad}`);

const currentRMSSD = 65;
const z_score = BaselineStore.normalizeRobustZScore(currentRMSSD, { median, mad });
console.log(`Robust Z-Score for current RMSSD of ${currentRMSSD}: ${z_score.toFixed(3)}`);
