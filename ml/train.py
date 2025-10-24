import pandas as pd
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, GRU, Dense, Attention, Layer
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping

# Configuration
PROCESSED_DATA_DIR = 'ml/data/processed'
MODEL_OUTPUT_DIR = 'ml/models/trained_keras'
SEQUENCE_LENGTH = 10  # Number of past timesteps to use for prediction
BATCH_SIZE = 64
EPOCHS = 50

# --- 1. Data Loading and Sequencing ---
def create_sequences(data, features, target):
    """Converts a DataFrame into sequences for RNN training."""
    X, y = [], []
    for session_id, group in data.groupby('session_id'):
        feature_data = group[features].values
        target_data = group[target].values
        for i in range(len(group) - SEQUENCE_LENGTH):
            X.append(feature_data[i:(i + SEQUENCE_LENGTH)])
            y.append(target_data[i + SEQUENCE_LENGTH])
    return np.array(X), np.array(y)

# --- 2. Model Definition ---
class InputAttention(Layer):
    """Custom Attention Layer"""
    def build(self, input_shape):
        self.W = self.add_weight(shape=(input_shape[-1], 1), initializer='random_normal', trainable=True)
        self.b = self.add_weight(shape=(input_shape[1], 1), initializer='zeros', trainable=True)
        super(InputAttention, self).build(input_shape)

    def call(self, x):
        e = tf.tanh(tf.tensordot(x, self.W, axes=1) + self.b)
        a = tf.nn.softmax(e, axis=1)
        output = x * a
        return output

def build_model(input_shape):
    """Builds the GRU model with an Input Attention layer."""
    inputs = Input(shape=input_shape)
    attention_out = InputAttention()(inputs)
    gru_out = GRU(64, return_sequences=False)(attention_out)
    outputs = Dense(1)(gru_out)

    model = Model(inputs=inputs, outputs=outputs)
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# --- 3. Main Training Logic ---
def main():
    """Main function to run the model training pipeline."""
    if not os.path.exists(MODEL_OUTPUT_DIR):
        os.makedirs(MODEL_OUTPUT_DIR)

    # Load data
    print("Loading preprocessed data...")
    train_df = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'train.csv'))
    val_df = pd.read_csv(os.path.join(PROCESSED_DATA_DIR, 'val.csv'))

    features = ['rmssd', 'pv', 'gaze_stability', 'pose_adherence']
    target = 'rmssd_change'

    # Create sequences
    print("Creating sequences for RNN training...")
    X_train, y_train = create_sequences(train_df, features, target)
    X_val, y_val = create_sequences(val_df, features, target)

    # Build model
    input_shape = (X_train.shape[1], X_train.shape[2])
    model = build_model(input_shape)
    model.summary()

    # Callbacks
    checkpoint_path = os.path.join(MODEL_OUTPUT_DIR, 'pacer_model.keras')
    checkpoint = ModelCheckpoint(
        checkpoint_path,
        monitor='val_loss',
        save_best_only=True,
        mode='min',
        verbose=1
    )
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        mode='min',
        restore_best_weights=True,
        verbose=1
    )

    # Train model
    print("\nStarting model training...")
    history = model.fit(
        X_train, y_train,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_val, y_val),
        callbacks=[checkpoint, early_stopping]
    )

    print("\nTraining complete.")
    print(f"Best model saved to '{checkpoint_path}'")

if __name__ == '__main__':
    main()
