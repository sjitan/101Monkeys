// app/js/pacer_engine.js

/**
 * @file Pacer session state machine and orchestrator.
 *
 * This engine manages the lifecycle of a pacing session, ensuring it runs for the
 * research-validated duration (Δt) and coordinating the sensor, decision,
 * and data logging modules.
 */

import * as sensorEngine from './sensor_engine.js';
import * as decisionEngine from './decision_engine.js';
import * as baselineStore from './baseline_store.js';

let config = {};
let sessionState = 'idle'; // idle, running, finished
let sessionTimer = null;
let sessionStartTime = null;

/**
 * Loads configuration from the policy file.
 */
async function loadConfig() {
  try {
    const response = await fetch('../config/policy_config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    config = await response.json();
    console.log('PacerEngine: Configuration loaded.', config);
  } catch (error) {
    console.error('PacerEngine: Failed to load configuration:', error);
    // Fallback to defaults if config fails to load
    config = {
      session_duration_s: 180,
      safety_threshold_pv: 1.5,
    };
  }
}

/**
 * The main loop that runs during a session, fetching features,
 * making predictions, and checking safety gates.
 */
async function pacerLoop() {
  if (sessionState !== 'running') {
    return;
  }

  const elapsedTime = (Date.now() - sessionStartTime) / 1000;
  if (elapsedTime >= config.session_duration_s) {
    await stopPacerSession();
    return;
  }

  // 1. Get feature vector from the sensor engine
  const featureVectorFt = await sensorEngine.getCurrentFeatureVector();

  // 2. Check hard safety gates
  if (featureVectorFt.z_pv >= config.safety_threshold_pv) {
    console.warn('PacerEngine: Safety gate breached! PV complexity is too high.', {z_pv: featureVectorFt.z_pv});
    // In a real implementation, we would trigger a safety protocol (e.g., restorative pose)
    // For now, we'll log and continue, but this is a critical hook.
  }

  // 3. Get the best protocol from the decision engine
  const decision = await decisionEngine.getAdaptiveProtocol();
  console.log('PacerEngine: Decision received:', decision);

  // 4. (Future) Use the utility score to select and display a protocol/cue.
  // displayProtocol(utilityU);

  // 5. Schedule the next loop iteration.
  setTimeout(pacerLoop, 1000); // Run the loop every second.
}


/**
 * Starts a new pacer session.
 */
export async function startPacerSession() {
  if (sessionState === 'running') {
    console.warn('PacerEngine: Session already in progress.');
    return;
  }

  await loadConfig(); // Ensure config is loaded
  await sensorEngine.startSensing(); // Start collecting data

  sessionState = 'running';
  sessionStartTime = Date.now();
  console.log(`PacerEngine: Session started. Duration: ${config.session_duration_s} seconds.`);

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
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }

  console.log('PacerEngine: Session finished. Stopping sensors and logging outcome.');
  sensorEngine.stopSensing();

  // Log the final outcome (Y_actual) for clinical validation.
  await baselineStore.logSessionOutcome();

  console.log('PacerEngine: Session complete.');
}

// Initialize on load
loadConfig();
