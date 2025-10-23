// app/js/dl_engine.js

/**
 * @file Interface for the Deep Learning (GRU) model in a federated context.
 *
 * This module is responsible for:
 * 1. Using the FederatedManager to determine the correct model for the user.
 * 2. Loading the cluster-specific TensorFlow.js GRU model.
 * 3. Providing a `predictUtility` function that takes a feature vector (Ft)
 *    and returns a predicted utility score (U).
 */

import * as tf from '@tensorflow/tfjs';

let modelCache = {}; // Cache for loaded models, keyed by modelPath
let federatedManager = null;
let currentModelPath = null;

/**
 * Initializes the DLEngine with a FederatedManager instance.
 * @param {FederatedManager} manager An instance of the FederatedManager.
 */
export function initializeDLEngine(manager) {
    federatedManager = manager;
    console.log('DLEngine: Initialized with FederatedManager.');
}

/**
 * Loads the GRU model for a specific user based on their cluster assignment.
 * @param {string} userId The ID of the user.
 * @returns {Promise<tf.LayersModel|null>} A promise that resolves to the loaded model.
 */
async function loadModelForUser(userId) {
    if (!federatedManager) {
        throw new Error("DLEngine: FederatedManager not initialized. Call initializeDLEngine first.");
    }

    try {
        const assignment = await federatedManager.getClusterAssignment(userId);
        const modelPath = assignment.modelPath;

        if (modelCache[modelPath]) {
            console.log(`DLEngine: Model for path ${modelPath} found in cache.`);
            currentModelPath = modelPath;
            return modelCache[modelPath];
        }

        console.log(`DLEngine: Loading model from path: ${modelPath}`);
        const model = await tf.loadLayersModel(modelPath);
        console.log('DLEngine: GRU model loaded successfully.');

        modelCache[modelPath] = model; // Cache the loaded model
        currentModelPath = modelPath;
        return model;

    } catch (error) {
        console.error('DLEngine: Failed to load GRU model:', error);
        return null;
    }
}

/**
 * Predicts the utility score (U) for a given feature vector (Ft) for a specific user.
 *
 * @param {object} featureVector The z-normalized feature vector from sensor_engine.
 * @param {string} userId The ID of the current user.
 * @returns {Promise<number>} A promise that resolves to the predicted utility score, U.
 */
export async function predictUtility(featureVector, userId) {
    const model = await loadModelForUser(userId);

    if (!model) {
        console.error('DLEngine: Model not available. Returning neutral utility.');
        return 0.5; // Return a neutral score if the model fails to load
    }

    // Convert the feature vector object into a tensor for prediction.
    // This assumes a fixed order of features. This should be managed by config.
    const featureKeys = Object.keys(featureVector).sort(); // Simple, predictable ordering
    const orderedFeatures = featureKeys.map(key => featureVector[key]);

    let inputTensor, predictionTensor, utilityScore;

    try {
        inputTensor = tf.tensor2d([orderedFeatures]);
        predictionTensor = model.predict(inputTensor);
        const scoreData = await predictionTensor.data();
        utilityScore = scoreData[0];
    } catch (error) {
        console.error("DLEngine: Error during prediction.", error);
        return 0.5; // Fallback on error
    } finally {
        // Clean up tensors to prevent memory leaks
        if (inputTensor) inputTensor.dispose();
        if (predictionTensor) predictionTensor.dispose();
    }

    return utilityScore;
}
