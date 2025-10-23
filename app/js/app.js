// Main application entry point for the "Jules-Hardened" architecture.

import { PacerSessionManager } from './decision_engine.js';
import { BaselineStore } from './baseline_store.js';
// Make SensorEngine available globally for the demonstration
import { SensorEngine } from './sensor_engine.js';
window.SensorEngine = SensorEngine;


console.log("Main App Initializing (Jules-Hardened Version)...");

async function runApplication() {
    // 1. Get the user's robust baselines (median/MAD).
    const userBaselines = BaselineStore.getMockUserBaselines();

    // 2. Define the user's performance metrics for archetype classification.
    const userPerformanceMetrics = { vae_score: 0.7, nsf_score: 0.6 }; // An "Operator" profile

    // 3. Create and initialize the session manager.
    const sessionManager = new PacerSessionManager("user_operator_final", userBaselines);
    await sessionManager.initialize(userPerformanceMetrics);

    // 4. Start the pacer session, which will run the sequential decision loop.
    sessionManager.startPacerSession();
}

// Start the application flow.
runApplication();
