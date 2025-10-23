/**
 * @fileoverview Manages the Controlled Event Protocol (CEP) by loading and
 * interpreting a protocol definition file.
 */

class CEPEngine {
    constructor() {
        this.protocol = null;
        this.currentStageKey = null;
    }

    /**
     * Asynchronously loads and initializes the CEP from a given JSON file.
     * This method must be called before any other methods are used.
     * @param {string} [protocolPath='app/config/cep_protocol.json'] - The path to the protocol definition file.
     * @throws {Error} If the protocol file cannot be fetched or parsed.
     */
    async initialize(protocolPath = 'app/config/cep_protocol.json') {
        try {
            const response = await fetch(protocolPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch protocol: ${response.statusText}`);
            }
            this.protocol = await response.json();
            this.currentStageKey = this.protocol.initial_stage;
            console.log(`[CEPEngine] Protocol '${this.protocol.protocolName}' loaded. Initial stage: ${this.currentStageKey}`);
        } catch (error) {
            console.error('[CEPEngine] Initialization failed:', error);
            throw error; // Re-throw to let the application handle the failure
        }
    }

    /**
     * Gets the key of the current stage (e.g., "BASELINE").
     * @returns {string|null} The current stage key, or null if not initialized.
     */
    getCurrentStageKey() {
        return this.currentStageKey;
    }

    /**
     * Gets the full data object for the current stage.
     * @private
     * @returns {object|null} The stage object or null.
     */
    _getCurrentStageData() {
        if (!this.protocol || !this.currentStageKey) {
            console.error("[CEPEngine] Engine not initialized or protocol has ended.");
            return null;
        }
        return this.protocol.stages[this.currentStageKey];
    }

    /**
     * Transitions the CEP to the next stage as defined in the protocol.
     */
    nextStage() {
        const currentStage = this._getCurrentStageData();
        if (currentStage && currentStage.next_stage) {
            this.currentStageKey = currentStage.next_stage;
            console.log(`[CEPEngine] Transitioned to stage: ${this.currentStageKey}`);
        } else {
            this.currentStageKey = null; // Protocol is complete
            console.log("[CEPEngine] Protocol has ended.");
        }
    }

    /**
     * Gets the user-facing instruction for the current stage.
     * @returns {string} The instruction text.
     */
    getCurrentStageInstructions() {
        return this._getCurrentStageData()?.instruction || "Protocol not loaded or complete.";
    }

    /**
     * Gets the duration in seconds for the current stage.
     * @returns {number} The duration in seconds.
     */
    getCurrentStageDuration() {
        return this._getCurrentStageData()?.duration_seconds || 0;
    }
}

export { CEPEngine };
