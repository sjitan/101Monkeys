import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from tqdm import tqdm

# Configuration
RAW_DATA_DIR = 'ml/data/raw_sessions'
PROCESSED_DATA_DIR = 'ml/data/processed'
TARGET_COLUMN = 'rmssd_change' # The immediate target for the model to predict
TEST_SIZE = 0.2
VAL_SIZE = 0.2

# --- 1. Load Data ---
def load_all_sessions(data_dir):
    """Loads all session CSVs into a single DataFrame."""
    all_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir) if f.endswith('.csv')]
    df_list = [pd.read_csv(f) for f in tqdm(all_files, desc="Loading session files")]
    return pd.concat(df_list, ignore_index=True)

# --- 2. Feature Engineering ---
def create_target_variable(df):
    """Creates the immediate target variable for the model."""
    # The goal is to predict the *next* rmssd value based on the current state.
    df[TARGET_COLUMN] = df.groupby('session_id')['rmssd'].shift(-1)
    # Drop the last row of each session since it has no target
    df.dropna(subset=[TARGET_COLUMN], inplace=True)
    return df

# --- 3. Main Preprocessing Logic ---
def main():
    """Main function to run the preprocessing pipeline."""
    if not os.path.exists(PROCESSED_DATA_DIR):
        os.makedirs(PROCESSED_DATA_DIR)

    # Load and feature engineer
    print("Loading and creating target variable...")
    df = load_all_sessions(RAW_DATA_DIR)
    df = create_target_variable(df)

    # Identify features and target
    features = ['rmssd', 'pv', 'gaze_stability', 'pose_adherence'] # Add other F_t features here
    target = TARGET_COLUMN

    # --- 4. Data Splitting (by session_id) ---
    print("Splitting data by session to prevent leakage...")
    session_ids = df['session_id'].unique()
    train_val_ids, test_ids = train_test_split(session_ids, test_size=TEST_SIZE, random_state=42)
    train_ids, val_ids = train_test_split(train_val_ids, test_size=VAL_SIZE / (1 - TEST_SIZE), random_state=42)

    train_df = df[df['session_id'].isin(train_ids)]
    val_df = df[df['session_id'].isin(val_ids)]
    test_df = df[df['session_id'].isin(test_ids)]

    # --- 5. Scaling ---
    print("Scaling features based on the training set...")
    scaler = StandardScaler()
    train_df[features] = scaler.fit_transform(train_df[features])
    val_df[features] = scaler.transform(val_df[features])
    test_df[features] = scaler.transform(test_df[features])

    # Save the scaler for later use (e.g., in the PWA)
    # import joblib
    # joblib.dump(scaler, os.path.join(PROCESSED_DATA_DIR, 'scaler.joblib'))

    # --- 6. Save Processed Data ---
    print("Saving processed datasets...")
    train_df.to_csv(os.path.join(PROCESSED_DATA_DIR, 'train.csv'), index=False)
    val_df.to_csv(os.path.join(PROCESSED_DATA_DIR, 'val.csv'), index=False)
    test_df.to_csv(os.path.join(PROCESSED_DATA_DIR, 'test.csv'), index=False)

    print("\nPreprocessing complete.")
    print(f"Train set size: {len(train_df)} ({len(train_ids)} sessions)")
    print(f"Validation set size: {len(val_df)} ({len(val_ids)} sessions)")
    print(f"Test set size: {len(test_df)} ({len(test_ids)} sessions)")

if __name__ == '__main__':
    main()
