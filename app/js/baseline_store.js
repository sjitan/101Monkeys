// app/js/baseline_store.js

/**
 * @file Manages on-device storage for user baselines and session outcomes.
 *
 * This module is responsible for:
 * 1. Storing and retrieving user physiological baselines (Median/MAD) using IndexedDB.
 * 2. Calculating and logging the clinically-validated session outcome (Y_actual)
 *    based on pre- and post-session metrics.
 */

import * as sensorEngine from './sensor_engine.js';
import * as configLoader from './config_loader.js'; // Assuming a config loader module

const DB_NAME = '101MonkeysDB';
const DB_VERSION = 1;
const BASELINE_STORE = 'baselines';
const OUTCOME_STORE = 'outcomes';

let db = null;

/**
 * Initializes the IndexedDB database and creates object stores.
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('BaselineStore: Database error:', event.target.error);
      reject('Database error');
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(BASELINE_STORE)) {
        dbInstance.createObjectStore(BASELINE_STORE, { keyPath: 'metric' });
      }
      if (!dbInstance.objectStoreNames.contains(OUTCOME_STORE)) {
        const outcomeStore = dbInstance.createObjectStore(OUTCOME_STORE, { autoIncrement: true });
        outcomeStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('BaselineStore: Database initialized successfully.');
      seedInitialBaselines(); // Seed with mock data for testing
      resolve(db);
    };
  });
}

/**
 * Seeds the database with mock baseline data if it's empty.
 */
async function seedInitialBaselines() {
  const transaction = db.transaction(BASELINE_STORE, 'readwrite');
  const store = transaction.objectStore(BASELINE_STORE);
  const countRequest = store.count();

  countRequest.onsuccess = () => {
    if (countRequest.result === 0) {
      console.log('BaselineStore: Seeding initial mock baselines...');
      const mockBaselines = {
        rmssd: { median: 55, mad: 10 },
        rmssd_delta: { median: 2, mad: 5 }, // Baseline for the CHANGE in RMSSD
        pv_complexity: { median: 0.7, mad: 0.2 },
        pv_complexity_delta: { median: -0.05, mad: 0.1 }, // Baseline for the CHANGE in PV
        resp_var: { median: 0.25, mad: 0.1 },
        resp_rate_error: { median: 0, mad: 0.5 },
        fatigue: { median: 4, mad: 1.5 },
      };
      for (const [metric, value] of Object.entries(mockBaselines)) {
        store.put({ metric, ...value });
      }
    }
  };
}

/**
 * Retrieves all current baselines from the database.
 * @returns {Promise<object>} A promise that resolves to an object of all baselines.
 */
export async function getBaselines() {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BASELINE_STORE, 'readonly');
    const store = transaction.objectStore(BASELINE_STORE);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const baselines = {};
      getAllRequest.result.forEach(item => {
        baselines[item.metric] = { median: item.median, mad: item.mad };
      });
      resolve(baselines);
    };
    getAllRequest.onerror = (event) => {
      console.error('BaselineStore: Error fetching baselines:', event.target.error);
      reject('Error fetching baselines');
    };
  });
}

/**
 * Calculates and logs the final session outcome (Y_actual).
 * This is the core of the clinical validation loop.
 */
export async function logSessionOutcome() {
  await initDB();
  const config = await configLoader.getConfig();
  const baselines = await getBaselines();

  // For this simulation, we'll need to mock the pre-session RMSSD.
  // In a real app, this would be captured and stored by the pacer_engine at session start.
  const preSessionRMSSD = 58; // Mock pre-session value

  // Get the final metrics from the sensor engine
  const finalMetrics = await sensorEngine.getCurrentRawMetrics(); // Assuming sensor_engine exposes this
  const postSessionRMSSD = finalMetrics.rmssd;
  const finalPVComplexity = finalMetrics.pv_complexity;

  // 1. Calculate RMSSDΔ and its z-score
  const rmssd_delta = postSessionRMSSD - preSessionRMSSD;
  const rmssd_delta_z = (rmssd_delta - baselines.rmssd_delta.median) / baselines.rmssd_delta.mad;

  // 2. Calculate final PV complexity z-score
  const pv_complexity_z = (finalPVComplexity - baselines.pv_complexity.median) / baselines.pv_complexity.mad;

  // 3. Determine the actual outcome Y_actual based on the research-validated formula
  const efficacyMet = rmssd_delta_z > config.efficacy_threshold_rmssd;
  const safetyMet = pv_complexity_z < config.safety_threshold_pv;
  const Y_actual = (efficacyMet && safetyMet) ? 1 : 0;

  console.log(`BaselineStore: Outcome Calculation:
    - RMSSDΔ Z-score: ${rmssd_delta_z.toFixed(2)} (Threshold: > ${config.efficacy_threshold_rmssd}) -> ${efficacyMet}
    - PV Complexity Z-score: ${pv_complexity_z.toFixed(2)} (Threshold: < ${config.safety_threshold_pv}) -> ${safetyMet}
    - Final Y_actual: ${Y_actual}`);

  // 4. Store the outcome for future model training
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OUTCOME_STORE, 'readwrite');
    const store = transaction.objectStore(OUTCOME_STORE);
    const outcomeRecord = {
      timestamp: new Date().toISOString(),
      Y_actual,
      rmssd_delta_z,
      pv_complexity_z,
      // We would also log the full feature vector (Ft) that led to this outcome
    };
    const addRequest = store.add(outcomeRecord);
    addRequest.onsuccess = () => resolve();
    addRequest.onerror = (event) => reject(event.target.error);
  });
}

// Ensure the DB is ready when the app loads
initDB();
