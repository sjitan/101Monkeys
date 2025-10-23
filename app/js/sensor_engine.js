// app/js/sensor_engine.js

/**
 * @file Manages physiological data sensing and feature extraction.
 *
 * This module is responsible for:
 * 1. Simulating raw physiological data (RMSSD, PV, etc.) for testing.
 * 2. Fetching user baselines (median, MAD) from the baseline store.
 * 3. Calculating the z-normalized feature vector (Ft) required by the DL engine.
 * 4. Computing rate-of-change features (ΔRMSSD, ΔPV).
 */

import * as baselineStore from './baseline_store.js';

let isSensing = false;
let sensingInterval = null;

// Mock raw sensor data state
let mockData = {
  rmssd: 60,
  pv_complexity: 0.8,
  resp_var: 0.2,
  resp_rate: 6.0,
  fatigue: 3,
};

// History for calculating derivatives (Δ)
let rmssdHistory = [];
let pvHistory = [];
const HISTORY_LENGTH = 5; // Store last 5 seconds of data for delta calculation

/**
 * Simulates the fluctuation of real physiological data.
 */
function updateMockData() {
  // Simulate some noise and drift
  mockData.rmssd += (Math.random() - 0.5) * 2;
  mockData.pv_complexity += (Math.random() - 0.5) * 0.1;
  mockData.resp_var += (Math.random() - 0.5) * 0.05;

  // Keep values within a reasonable physiological range
  mockData.rmssd = Math.max(20, Math.min(120, mockData.rmssd));
  mockData.pv_complexity = Math.max(0.1, Math.min(2.0, mockData.pv_complexity));
  mockData.resp_var = Math.max(0.05, Math.min(0.5, mockData.resp_var));

  // Update history buffers
  rmssdHistory.push(mockData.rmssd);
  pvHistory.push(mockData.pv_complexity);
  if (rmssdHistory.length > HISTORY_LENGTH) rmssdHistory.shift();
  if (pvHistory.length > HISTORY_LENGTH) pvHistory.shift();
}

/**
 * Calculates the rate of change for a given history buffer.
 * A simple linear regression slope would be more robust, but for now,
 * we'll use the difference between the latest point and the average of the past.
 * @param {number[]} history The historical data points.
 * @returns {number} The calculated rate of change.
 */
function calculateDelta(history) {
  if (history.length < HISTORY_LENGTH) {
    return 0; // Not enough data to compute a stable delta
  }
  const current_val = history[history.length - 1];
  const past_avg = history.slice(0, history.length - 1).reduce((a, b) => a + b, 0) / (history.length - 1);
  return current_val - past_avg;
}


/**
 * Calculates the z-score of a value given a baseline.
 * z = (value - median) / MAD
 * @param {number} value The current sensor value.
 * @param {object} baseline The baseline object with { median, mad }.
 * @returns {number} The calculated z-score.
 */
function calculateZScore(value, baseline) {
  if (!baseline || baseline.mad === 0) {
    return 0; // Avoid division by zero; return a neutral score.
  }
  return (value - baseline.median) / baseline.mad;
}

/**
 * Starts the mock sensor data generation.
 */
export function startSensing() {
  if (isSensing) return;
  isSensing = true;
  rmssdHistory = [];
  pvHistory = [];
  sensingInterval = setInterval(updateMockData, 1000); // Update mock data every second
  console.log('SensorEngine: Sensing started.');
}

/**
 * Stops the mock sensor data generation.
 */
export function stopSensing() {
  if (!isSensing) return;
  isSensing = false;
  clearInterval(sensingInterval);
  sensingInterval = null;
  console.log('SensorEngine: Sensing stopped.');
}

/**
 * Fetches the latest sensor data and computes the full feature vector Ft.
 * @returns {Promise<object>} A promise that resolves to the feature vector object.
 */
export async function getCurrentFeatureVector() {
  if (!isSensing) {
    // Return a zero vector if not sensing
    return { z_rmssd: 0, z_delta_rmssd: 0, z_pv: 0, z_delta_pv: 0, z_resp_var: 0, z_resp_rate_error: 0, z_fatigue: 0 };
  }

  const baselines = await baselineStore.getBaselines();

  const delta_rmssd = calculateDelta(rmssdHistory);
  const delta_pv = calculateDelta(pvHistory);

  // Note: For deltas, we need baselines for the deltas themselves.
  // For this implementation, we will z-score them against the raw value's baseline,
  // which is a simplification. A more advanced version would baseline the deltas too.
  const z_rmssd = calculateZScore(mockData.rmssd, baselines.rmssd);
  const z_delta_rmssd = calculateZScore(delta_rmssd, baselines.rmssd_delta); // Assumes we have a baseline for the delta
  const z_pv = calculateZScore(mockData.pv_complexity, baselines.pv_complexity);
  const z_delta_pv = calculateZScore(delta_pv, baselines.pv_complexity_delta); // Assumes we have a baseline for the delta
  const z_resp_var = calculateZScore(mockData.resp_var, baselines.resp_var);
  const z_fatigue = calculateZScore(mockData.fatigue, baselines.fatigue);

  // RespRate error is special: it's the deviation from a target, not a raw value.
  // Assuming a resonant frequency (RF) target of 5.5 bpm for this example.
  const rf_target = 5.5;
  const resp_rate_error = mockData.resp_rate - rf_target;
  const z_resp_rate_error = calculateZScore(resp_rate_error, baselines.resp_rate_error); // Assumes baseline for the error

  return {
    z_rmssd,
    z_delta_rmssd,
    z_pv,
    z_delta_pv,
    z_resp_var,
    z_resp_rate_error,
    z_fatigue,
  };
}

/**
 * Returns the current raw (un-normalized) sensor values.
 * Needed by the baseline_store to calculate post-session outcomes.
 * @returns {Promise<object>} A promise that resolves to the raw mock data.
 */
export async function getCurrentRawMetrics() {
    return mockData;
}
