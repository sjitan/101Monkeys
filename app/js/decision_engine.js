// Decision Engine: Now integrates with the Protocol Library to deliver archetype-specific sessions.
import { ProtocolLibrary } from './protocol_library.js';

console.log("Decision Engine Loaded.");

// --- Main Application Flow (Illustrative) ---

class PacerSessionManager {
    constructor(userProfile) {
        this.userId = userProfile.userId;
        this.userArchetype = userProfile.archetype; // 'Operator', 'Insulated', etc.
        this.protocol = null;
    }

    /**
     * Initializes the session by loading the correct protocol for the user's archetype.
     */
    initialize() {
        console.log(`Initializing session for user ${this.userId}, archetype: ${this.userArchetype}`);
        this.protocol = ProtocolLibrary.getProtocol(this.userArchetype);
        console.log(`Loaded Protocol: ${this.protocol.pacer.name}`);
    }

    /**
     * Starts the Pacer session.
     * In a real application, this would kick off the sensor engine, UI updates, etc.
     */
    startPacerSession() {
        if (!this.protocol) {
            console.error("Session not initialized. Call initialize() first.");
            return;
        }
        console.log("--- Starting Pacer Session ---");
        console.log(`Executing protocol: ${this.protocol.pacer.name}`);
        this.protocol.pacer.stages.forEach(stage => {
            console.log(`  - Stage: ${stage.type}, Duration: ${stage.duration}s`);
        });
        console.log("--------------------------");
    }
}


// --- Example Usage ---

async function runDecisionEngineExample() {
    // 1. We have a user's profile, which now includes their archetype.
    // This archetype would have been fetched previously via the FederatedManager.
    const userProfile = {
        userId: "user_amp_123",
        archetype: "Amplifier", // This user is highly sensitive.
        // ...other profile data
    };

    // 2. Create a session manager for this user.
    const sessionManager = new PacerSessionManager(userProfile);

    // 3. Initialize the session. The decision engine loads the correct protocol.
    sessionManager.initialize();

    // 4. Start the session. The tailored "Amplifier" protocol will be used.
    sessionManager.startPacerSession();

    // --- Another Example for an Operator ---
    const operatorProfile = {
        userId: "user_op_456",
        archetype: "Operator"
    };
    const operatorSession = new PacerSessionManager(operatorProfile);
    operatorSession.initialize();
    operatorSession.startPacerSession();
}

runDecisionEngineExample();
