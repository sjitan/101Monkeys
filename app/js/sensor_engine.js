// Sensor Engine: Handles all real-time physiological sensing and Signal Quality Assurance (SQA).

console.log("Sensor Engine Loaded.");

const SENSOR_FIDELITY_THRESHOLDS = {
    ocular: 0.7, // Example threshold for ocular sensor fidelity
    rf: 0.6,     // Example threshold for RF sensor fidelity
};

/**
 * The Signal Quality Assurance (SQA) Layer.
 * This acts as the first-layer "Fidelity Filter" to prevent "Garbage In, Garbage Out."
 */
const SQA = {
    /**
     * Gating Function: Provides a "Go/No-Go" decision for a given sensor stream.
     * @param {string} sensorType - The type of sensor ('ocular', 'rf', etc.).
     * @param {object} sensorData - The raw data from the sensor.
     * @returns {{pass: boolean, fidelity: number}} - An object indicating if the data passes the gate and its fidelity score.
     */
    gate: (sensorType, sensorData) => {
        let fidelity = 0;
        switch (sensorType) {
            case 'ocular':
                fidelity = SQA.models.calculateOcularFidelity(sensorData);
                break;
            case 'rf':
                fidelity = SQA.models.calculateRfFidelity(sensorData);
                break;
            default:
                fidelity = 0;
        }

        const pass = fidelity >= (SENSOR_FIDELITY_THRESHOLDS[sensorType] || 0);

        if (!pass) {
            console.warn(`SQA GATE FAILED for ${sensorType} sensor. Fidelity: ${fidelity}`);
        }

        return { pass, fidelity };
    },

    /**
     * Weighting Function: Provides a "trust" score for a given sensor stream.
     * This score is passed as a feature to the main Pacer_Model.
     * @param {number} fidelity - The fidelity score from the gating function.
     * @returns {number} - The weight to be assigned to the sensor data.
     */
    weigh: (fidelity) => {
        // For now, the weight is the fidelity score itself, but this can be a more complex function.
        return fidelity;
    },

    /**
     * Lightweight models to calculate fidelity scores.
     * In a real implementation, these would be more sophisticated.
     */
    models: {
        /**
         * Calculates a fidelity score for the ocular sensor.
         * @param {object} data - Raw ocular data (e.g., illumination, motion blur).
         * @returns {number} - A fidelity score between 0 and 1.
         */
        calculateOcularFidelity: (data = { illumination: 0.8, motionBlur: 0.1 }) => {
            // Simple placeholder logic: high illumination and low motion blur = high fidelity.
            const score = data.illumination * (1 - data.motionBlur);
            return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
        },

        /**
         * Calculates a fidelity score for the RF (Wi-Fi/Radar) sensor.
         * @param {object} data - Raw RF data (e.g., signal-to-noise ratio).
         * @returns {number} - A fidelity score between 0 and 1.
         */
        calculateRfFidelity: (data = { snr: 0.75 }) => {
            // Simple placeholder logic: higher SNR = high fidelity.
            const score = data.snr;
            return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
        }
    }
};

// --- Example Usage ---
const exampleOcularData = { illumination: 0.9, motionBlur: 0.05 };
const ocularCheck = SQA.gate('ocular', exampleOcularData);
if (ocularCheck.pass) {
    const ocularWeight = SQA.weigh(ocularCheck.fidelity);
    console.log(`Ocular data passed SQA gate with fidelity ${ocularCheck.fidelity} and weight ${ocularWeight}.`);
}

const badOcularData = { illumination: 0.5, motionBlur: 0.4 };
SQA.gate('ocular', badOcularData);

const exampleRfData = { snr: 0.8 };
const rfCheck = SQA.gate('rf', exampleRfData);
if (rfCheck.pass) {
    const rfWeight = SQA.weigh(rfCheck.fidelity);
    console.log(`RF data passed SQA gate with fidelity ${rfCheck.fidelity} and weight ${rfWeight}.`);
}