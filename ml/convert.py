import tensorflow as tf
import tensorflowjs as tfjs
import os

# It is essential to import the custom layer so TensorFlow knows about it
from train import InputAttention

# Configuration
KERAS_MODEL_PATH = 'ml/models/trained_keras/pacer_model.keras'
TFJS_MODEL_DIR = 'ml/models/tfjs_model'

def main():
    """Converts the trained Keras model to TensorFlow.js format."""
    if not os.path.exists(TFJS_MODEL_DIR):
        os.makedirs(TFJS_MODEL_DIR)

    # --- 1. Load the Trained Keras Model ---
    print(f"Loading Keras model from: {KERAS_MODEL_PATH}")

    # When loading a model with custom layers for conversion,
    # you must provide them in the `custom_objects` dictionary.
    custom_objects = {'InputAttention': InputAttention}
    model = tf.keras.models.load_model(KERAS_MODEL_PATH, custom_objects=custom_objects)

    print("Model loaded successfully.")
    model.summary()

    # --- 2. Use tensorflowjs to Convert ---
    print(f"\nConverting model to TensorFlow.js format in: {TFJS_MODEL_DIR}")
    tfjs.converters.save_keras_model(model, TFJS_MODEL_DIR)

    print("\nConversion complete.")
    print("The following files should now be in the output directory:")
    for f in os.listdir(TFJS_MODEL_DIR):
        print(f"- {f}")

if __name__ == '__main__':
    main()
