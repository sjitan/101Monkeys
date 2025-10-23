// app/js/pacer_engine.js

/**
 * @file CEP-driven pacer session state machine and orchestrator.
 *
 * This engine manages the lifecycle of a pacing session according to the
 * stages defined in the Controlled Event Protocol (CEP). It coordinates the
 * sensor, decision, and data logging modules, ensuring each stage is executed
 * for its specified duration and that data is tagged appropriately.
 */

import * as sensorEngine from './sensor_engine.js';
import * as decisionEngine from './decision_engine.js';
import * as baselineStore from './baseline_store.js';
import { CEPEngine } from './cep_engine.js';

let sessionState = 'idle'; // idle, running, finished
let stageTimer = null;
let currentUserId = null; // Store the user ID for the session

const cepEngine = new CEPEngine();

/**
 * The main loop that runs during a session. Its behavior is determined
 * by the current stage of the Controlled Event Protocol.
 */
async function pacerLoop() {
    if (sessionState !== 'running') {
        return;
    }

    const stage = cepEngine.getCurrentStageKey();
    if (!stage || stage === 'COMPLETE') {
        await stopPacerSession();
        return;
    }

    console.log(`[PacerEngine] Loop running for stage: ${stage}`);

    // Get features and log them with the current stage tag.
    const featureVector = await sensorEngine.getCurrentFeatureVector();
    baselineStore.logRealtimeMetrics({ ...featureVector, cep_stage: stage });

    // The decision engine is ONLY active during the INTERVENTION stage.
    if (stage === 'INTERVENTION') {
        // Pass the userId to the decision engine for federated model selection.
        const decision = await decisionEngine.getAdaptiveProtocol(currentUserId);
        console.log('[PacerEngine] Adaptive decision:', decision);
        // (Future) Here, the UI would be updated with the chosen protocol.
        // ui.updateProtocol(decision);
    }

    // Continue the loop
    setTimeout(pacerLoop, 1000); // Run the loop every second.
}

/**
 * Transitions to the next CEP stage and sets a timer for its duration.
 */
async function advanceToNextStage() {
    cepEngine.nextStage();
    const stage = cepEngine.getCurrentStageKey();

    if (!stage || stage === 'COMPLETE') {
        await stopPacerSession();
        return;
    }

    const duration = cepEngine.getCurrentStageDuration();
    const instructions = cepEngine.getCurrentStageInstructions();

    console.log(`[PacerEngine] Entering stage: ${stage} for ${duration} seconds.`);
    console.log(`[PacerEngine] Instructions: ${instructions}`);
    // (Future) Update UI with new stage instructions
    // ui.showStageInstructions(instructions);

    // Set a timer to automatically advance to the next stage.
    if (duration > 0) {
        stageTimer = setTimeout(advanceToNextStage, duration * 1000);
    }
}


/**
 * Starts a new pacer session, driven by the CEP.
 * @param {string} userId - The ID of the user starting the session.
 */
export async function startPacerSession(userId) {
    if (sessionState === 'running') {
        console.warn('[PacerEngine] Session already in progress.');
        return;
    }

    console.log('[PacerEngine] Initializing new session...');
    currentUserId = userId;

    // Initialize all engines
    await cepEngine.initialize();
    await sensorEngine.startSensing();

    sessionState = 'running';

    // Start the protocol flow by setting the initial stage.
    const initialStage = cepEngine.getCurrentStageKey();
    const duration = cepEngine.getCurrentStageDuration();
    const instructions = cepEngine.getCurrentStageInstructions();

    console.log(`[PacerEngine] Starting CEP. Initial stage: ${initialStage} for ${duration} seconds.`);
    console.log(`[PacerEngine] Instructions: ${instructions}`);
    // ui.showStageInstructions(instructions);

    if (duration > 0) {
        stageTimer = setTimeout(advanceToNextStage, duration * 1000);
    }

    pacerLoop();
}

/**
 * Stops the current pacer session and logs the final outcome.
 */
export async function stopPacerSession() {
    if (sessionState !== 'running') {
        return;
    }

    sessionState = 'finished';
    if (stageTimer) {
        clearTimeout(stageTimer);
        stageTimer = null;
    }

    console.log('[PacerEngine] Session finished. Stopping sensors and logging outcome.');
    sensorEngine.stopSensing();

    // Log the final outcome (Y_actual) for clinical validation.
    await baselineStore.logSessionOutcome();

    console.log('[PacerEngine] Session complete.');
}
