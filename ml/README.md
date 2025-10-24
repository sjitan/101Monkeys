# Machine Learning Pipeline for the Pacer Model

This directory contains the complete end-to-end pipeline for generating synthetic data, preprocessing it, training the `Pacer_Model`, and converting it for on-device use in the PWA.

## Overview

The pipeline is designed as a series of modular scripts that should be run in a specific order. Each script handles a distinct phase of the machine learning lifecycle.

-   **`generator.py`**: Creates raw synthetic user session data.
-   **`preprocess.py`**: Cleans, prepares, and splits the data for training.
-   **`train.py`**: Defines and trains the GRU-based `Pacer_Model`.
-   **`evaluate.py`**: Tests the trained model's performance on unseen data.
-   **`convert.py`**: Converts the trained Keras model to TensorFlow.js format for the PWA.

## Prerequisites

Before running the pipeline, ensure you have Python 3.10+ and have installed all the required dependencies.

```bash
# From the root of the repository
pip install -r ml/requirements.txt
```

## How to Run the Full Pipeline

The scripts are designed to be run sequentially from the root of the repository.

### Step 1: Generate Synthetic Data

This script simulates 100 realistic 15-minute user sessions and saves them as individual CSV files.

```bash
python3 ml/generator.py
```
**Output**: Raw session files will be saved in `ml/data/raw_sessions/`.

### Step 2: Preprocess the Data

This script loads all raw sessions, creates the target variable, splits the data into train/validation/test sets (ensuring no data leakage), and scales the features.

```bash
python3 ml/preprocess.py
```
**Output**: `train.csv`, `val.csv`, and `test.csv` will be saved in `ml/data/processed/`.

### Step 3: Train the Model

This script loads the processed data, defines the GRU model with an Input Attention layer, and trains it. The best model is saved based on validation loss.

```bash
python3 ml/train.py
```
**Output**: The best trained model will be saved as `pacer_model.keras` in `ml/models/trained_keras/`.

### Step 4: Evaluate the Model

This script loads the trained model and the test set to evaluate its performance on unseen data.

```bash
python3 ml/evaluate.py
```
**Output**: Key performance metrics (MSE, MAE, Directional Accuracy) will be printed to the console.

### Step 5: Convert the Model for On-Device Use

This is the final step, which converts the saved Keras model into the TensorFlow.js format required by the PWA.

```bash
python3 ml/convert.py
```
**Output**: The converted model (`model.json` and binary weight files) will be saved in `ml/models/tfjs_model/`. These files can then be copied into the `app/js/model/` directory of the PWA.
