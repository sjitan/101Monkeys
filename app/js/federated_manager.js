/**
 * @fileoverview Manages federated model loading for the Adaptive Cluster Network.
 */

class FederatedManager {
    /**
     * @param {object} config Configuration object containing API_BASE_URL.
     */
    constructor(config) {
        this.config = config;
        this.apiBaseUrl = this.config.get('API_BASE_URL');
    }

    /**
     * Fetches the cluster assignment and model path for a given user from the backend.
     * @param {string} userId The user's ID.
     * @returns {Promise<object>} An object containing the clusterId and modelPath.
     * @throws {Error} If the network request fails or the API returns an error.
     */
    async getClusterAssignment(userId) {
        if (!this.apiBaseUrl) {
            throw new Error("[FederatedManager] API_BASE_URL is not configured.");
        }

        const url = `${this.apiBaseUrl}/cluster?userId=${userId}`;
        console.log(`[FederatedManager] Getting cluster assignment for user: ${userId} from ${url}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`[FederatedManager] Network response was not ok: ${response.statusText}. Body: ${errorBody}`);
            }
            const data = await response.json();
            console.log("[FederatedManager] Received cluster assignment:", data);
            return data;
        } catch (error) {
            console.error("[FederatedManager] Failed to fetch cluster assignment:", error);
            // Fallback to a default model in case of network failure
            return this.getFallbackAssignment();
        }
    }

    /**
     * Provides a default/fallback model path if the backend is unreachable.
     * @returns {object} A default cluster assignment object.
     */
    getFallbackAssignment() {
        console.warn("[FederatedManager] Using fallback model assignment.");
        return {
            clusterId: "fallback_cluster",
            modelPath: "app/tfl/global_model/model.json" // A safe, default model
        };
    }
}

export { FederatedManager };
