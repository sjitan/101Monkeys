// Federated Manager: Handles anonymized communication with the backend for archetype classification and federated learning.

console.log("Federated Manager Loaded.");

const FederatedManager = {
    ARCHETYPE_CLASSIFIER_URL: 'https://api.101monkeys.com/assign_cluster', // This URL will now point to our archetype classifier

    /**
     * Fetches the user's Autonomic Archetype from the backend classifier.
     * This now sends a POST request with the user's performance metrics.
     *
     * @param {string} userId - The user's unique identifier.
     * @param {number} vae_score - Volitional Autonomic Efficacy (e.g., 0.75 for 75% success).
     * @param {number} nsf_score - Non-Local Signal Fidelity (e.g., a z-score of 1.2).
     * @returns {Promise<string>} - The archetype tag (e.g., 'Operator').
     */
    getArchetypeAssignment: async (userId, vae_score, nsf_score) => {
        console.log(`Fetching archetype assignment for userId: ${userId}`);

        // In a real application, this makes a network request.
        // For now, we simulate the request and the logic of the backend classifier.
        const requestBody = {
            userId: userId,
            vae: vae_score,
            nsf: nsf_score
        };

        // const response = await fetch(FederatedManager.ARCHETYPE_CLASSIFIER_URL, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(requestBody)
        // });
        // const data = await response.json();
        // return data.archetype;

        // --- Simulation of the Backend Logic (for local testing) ---
        const VAE_THRESHOLD = 0.5;
        const NSF_THRESHOLD = 0.0;
        let archetype = "Insulated";

        if (vae_score >= VAE_THRESHOLD && nsf_score >= NSF_THRESHOLD) {
            archetype = "Operator";
        } else if (vae_score >= VAE_THRESHOLD && nsf_score < NSF_THRESHOLD) {
            archetype = "Stabilizer";
        } else if (vae_score < VAE_THRESHOLD && nsf_score >= NSF_THRESHOLD) {
            archetype = "Amplifier";
        }

        console.log(`Assigned to archetype: ${archetype}`);
        return archetype;
    }
};

// --- Example Usage ---

async function runArchetypeExample() {
    // Simulate user performance data after 20 Pacer and 20 CEP sessions.
    const userId = "user_operator_1";
    const vae = 0.8; // High VAE (80% success)
    const nsf = 1.5; // High NSF (z-score of 1.5)

    console.log(`Running example for an 'Operator' profile...`);
    const archetype = await FederatedManager.getArchetypeAssignment(userId, vae, nsf);
    console.log(`Final Archetype: ${archetype}`); // Expected: Operator

    // The Decision Engine would then use this archetype to load the correct protocol.
    // e.g., const protocol = ProtocolLibrary.getProtocol(archetype);
}

runArchetypeExample();
