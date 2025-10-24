import pandas as pd
import numpy as np
import os
import tensorflow as tf
from sklearn.metrics import mean_squared_error, mean_absolute_error

# It's crucial to reuse the sequencing function from the training script
from train import create_sequences

# Configuration
PROCESSED_DATA_DIR = 'ml/data/processed'
MODEL_PATH = 'ml/models/trained_keras/pacer_model.keras'

def calculate_directional_accuracy(y_true, y_pred):
    """
    Calculates the accuracy of predicting the direction of change (up or down).
    This is a useful metric for this specific problem.
    """
    true_direction = np.sign(y_true[1:] - y_true[:-1])
    pred_direction = np.sign(y_pred[1:] - y_pred[:-1])
    # Ignore cases where the direction is zero (no change)
    true_direction = true_direction[true_direction != 0]
    pred_direction = pred_direction[:len(true_direction)] # Align lengths
    return np.mean(true_direction == pred_direction) * 100

def main():
    """Main function to run the model evaluation."""
    # --- 1. Load Data and Model ---
    print("Loading test data and trained model...")
    test_df = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'test.csv'))

    # Custom objects are needed if the model contains custom layers
    custom_objects = {'InputAttention': tf.keras.layers.Layer}
    try:
        model = tf.keras.models.load_model(MODEL_PATH, custom_objects=custom_objects)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")
        # A common issue is not registering custom layers. Let's try loading without it first.
        try:
            from train import InputAttention
            custom_objects = {'InputAttention': InputAttention}
            model = tf.keras.models.load_model(MODEL_PATH, custom_objects=custom_objects)
            print("Model loaded successfully with custom object.")
        except Exception as e_inner:
            print(f"Failed to load model even with custom object: {e_inner}")
            return

    features = ['rmssd', 'pv', 'gaze_stability', 'pose_adherence']
    target = 'rmssd_change'

    # --- 2. Create Test Sequences ---
    print("Creating test sequences...")
    X_test, y_test = create_sequences(test_df, features, target)

    # --- 3. Make Predictions ---
    print("Making predictions on the test set...")
    y_pred = model.predict(X_test)

    # --- 4. Calculate Metrics ---
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    dir_acc = calculate_directional_accuracy(y_test.flatten(), y_pred.flatten())

    print("\n--- Model Evaluation Results ---")
    print(f"Mean Squared Error (MSE): {mse:.4f}")
    print(f"Mean Absolute Error (MAE): {mae:.4f}")
    print(f"Directional Accuracy: {dir_acc:.2f}%")
    print("---------------------------------")

if __name__ == '__main__':
    main()
