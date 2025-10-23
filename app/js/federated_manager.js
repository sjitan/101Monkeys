// Federated Manager: Handles archetype classification and the federated learning loop.

import { BaselineStore } from './baseline_store.js';

console.log("Federated Manager (with Learning Loop) Loaded.");

export const FederatedManager = {
    ARCHETYPE_CLASSIFIER_URL: 'https://api.101monkeys.com/assign_cluster',

    /**
     * Fetches the user's Autonomic Archetype from the backend classifier.
     */
    getArchetypeAssignment: async (userId, vae_score, nsf_score) => {
        // Using a simulation for local testing.
        const VAE_THRESHOLD = 0.5;
        const NSF_THRESHOLD = 0.0;
        if (vae_score >= VAE_THRESHOLD && nsf_score >= NSF_THRESHOLD) return "Operator";
        if (vae_score >= VAE_THRESHOLD && nsf_score < NSF_THRESHOLD) return "Stabilizer";
        if (vae_score < VAE_THRESHOLD && nsf_score >= NSF_THRESHOLD) return "Amplifier";
        return "Insulated";
    },

    /**
     * Creates the Autonomic Profile Vector (APV) from user baselines.
     * The APV is an anonymized vector of physiological traits for server-side clustering.
     * @param {object} userBaselines - The user's baseline physiological metrics (median/mad).
     * @returns {object} - The anonymized Autonomic Profile Vector.
     */
    createAutonomicProfileVector: (userBaselines) => {
        // This is a simplified APV. A real system might use more complex statistical features.
        return {
            // Example traits: Is the user vagally dominant? Are they sympathetically volatile?
            vagal_tone_median: userBaselines.rmssd.median,
            sympathetic_volatility_mad: userBaselines.pv_sequence.mad,
            respiratory_coherence_mad: userBaselines.resp_var.mad
        };
    },

    /**
     * Prepares the anonymized "Report" to be sent to the federated server.
     * This report contains ONLY the mathematical model updates and the anonymized profile vector.
     * @param {object} modelTrainingResult - Contains the outcome of the on-device training.
     * @param {object} userBaselines - The user's baseline physiological metrics.
     * @returns {object} - The anonymized report object.
     */
    prepareAnonymizedReport: (modelTrainingResult, userBaselines) => {
        // 1. Simulate the model_delta. In a real TF.js implementation, this would be
        //    the serialized weight changes (gradients) after a training step.
        const model_delta = {
            gradients: `session_${Date.now()}_gradients`, // Placeholder for actual gradient data
            training_loss: modelTrainingResult.loss
        };

        // 2. Create the Autonomic Profile Vector.
        const apv = FederatedManager.createAutonomicProfileVector(userBaselines);

        const report = {
            model_delta,
            apv,
        };

        // Use JSON.stringify to ensure the full object is logged for verification.
        console.log("Prepared Anonymized Report for Federated Server:", JSON.stringify(report, null, 2));
        return report;
    }
};
