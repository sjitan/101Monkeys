/**
 * @file dl_engine.js
 * @description Manages the loading and execution of the on-device
 * TensorFlow.js Deep Learning model (GRU) for personalized pacing decisions.
 */

// Note: TensorFlow.js library would need to be imported in the main HTML.
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>

const MODEL_PATH = '../tfl/model.json'; // Default model shipped with the app
const MODEL_DB_NAME = '101MonkeysDB';
const MODEL_STORE_NAME = 'models';
const MODEL_KEY = 'gru_pacer_model';

let model = null;

/**
 * Loads the GRU model. It first checks for a model in IndexedDB,
 * which may have been downloaded by sync_agent.js. If not found,
 * it loads the default model bundled with the application from /app/tfl/.
 * This function must be called and awaited before predictions can be made.
 * @returns {Promise<tf.LayersModel>} A promise that resolves with the loaded model.
 */
async function loadModel() {
    if (model) {
        return Promise.resolve(model);
    }

    try {
        // First, try to load the model from IndexedDB.
        console.log('Attempting to load model from IndexedDB...');
        model = await tf.loadLayersModel(`indexeddb://${MODEL_KEY}`);
        console.log('Model loaded successfully from IndexedDB.');
    } catch (e) {
        console.warn('Model not found in IndexedDB, loading from bundled assets.', e);
        try {
            // If it fails, load the default model from the bundled path.
            model = await tf.loadLayersModel(MODEL_PATH);
            console.log('Default bundled model loaded successfully.');
        } catch (error) {
            console.error('Failed to load default model:', error);
            return Promise.reject('Could not load any model.');
        }
    }

    return model;
}

/**
 * Runs a prediction using the loaded GRU model to get a pacing utility score (U).
 *
 * @param {Array<Array<number>>} featureVector - The input data for the model.
 *   Shape should be [timesteps, num_features].
 *   Example: A 2-minute window (12 timesteps of 10s) of 5 features.
 *   [[rmssd_1, hr_1, pv_1, ...], [rmssd_2, hr_2, pv_2, ...], ...]
 *
 * @returns {Promise<number>} A promise that resolves with the utility score U, a value in [0, 1].
 */
async function predictPacingUtility(featureVector) {
    if (!model) {
        await loadModel();
    }

    // Defensive check to ensure the model is available.
    if (!model) {
        console.error('Prediction failed: Model is not loaded.');
        return Promise.reject('Model not available.');
    }

    return tf.tidy(() => {
        // Reshape the input to match the model's expected input shape: [batch_size, timesteps, features].
        // Here, batch_size is 1 as we are predicting a single sequence.
        const inputTensor = tf.tensor([featureVector]);

        // Run the prediction.
        const prediction = model.predict(inputTensor);

        // The output is expected to be a tensor of shape [1, 1]. We extract the scalar value.
        const utilityScore = prediction.dataSync()[0];

        // Clean up tensors.
        inputTensor.dispose();
        prediction.dispose();

        return utilityScore;
    });
}

// Function to save a downloaded model to IndexedDB (to be used by sync_agent.js)
/**
 * Saves a TensorFlow.js model to IndexedDB for offline use.
 * @param {tf.LayersModel} modelToSave - The model instance to save.
 * @returns {Promise<void>}
 */
async function saveModelToDB(modelToSave) {
    if (!modelToSave) return Promise.reject('No model provided to save.');
    const result = await modelToSave.save(`indexeddb://${MODEL_KEY}`);
    console.log('Model saved to IndexedDB:', result);
}


export {
    loadModel,
    predictPacingUtility,
    saveModelToDB // Export for sync_agent
};
