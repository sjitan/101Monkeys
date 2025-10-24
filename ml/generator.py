import pandas as pd
import numpy as np
import os
from tqdm import tqdm
import random

# Configuration
NUM_SESSIONS = 100
SESSION_DURATION_S = 15 * 60
TIMESTEP_S = 3
OUTPUT_DIR = 'ml/data/raw_sessions'

# --- 1. Define Personas (Autonomic Archetypes) ---
PERSONAS = {
    'Responsive': {'base_rmssd': 70, 'rmssd_flex': 20, 'arousal_sensitivity': 0.5, 'recovery_rate': 1.5},
    'Insulated': {'base_rmssd': 80, 'rmssd_flex': 5, 'arousal_sensitivity': 0.2, 'recovery_rate': 0.5},
    'Regulator-in-Training': {'base_rmssd': 40, 'rmssd_flex': 15, 'arousal_sensitivity': 1.5, 'recovery_rate': 1.0},
    'Depleted': {'base_rmssd': 30, 'rmssd_flex': 8, 'arousal_sensitivity': 1.2, 'recovery_rate': 0.7}
}

# --- 2. Define Interventions (Chair Yoga Arsenal) ---
INTERVENTIONS = {
    'grounding': {'rmssd_effect': 1.2, 'pv_effect': -0.8, 'duration_range': (30, 60)},
    'mobilizing': {'rmssd_effect': -0.5, 'pv_effect': 1.5, 'duration_range': (45, 90)},
    'restorative': {'rmssd_effect': 2.0, 'pv_effect': -1.5, 'duration_range': (60, 120)}
}
INTERVENTION_IDS = [f'{cat}_{i:02d}' for cat, N in (('grounding', 7), ('mobilizing', 7), ('restorative', 6)) for i in range(1, N + 1)]

def get_intervention_category(intervention_id):
    # Correctly return the category part of the ID
    return intervention_id.split('_')[0]

# --- 3. Simulation Loop ---
def generate_session(session_id):
    """Simulates a single 15-minute user session."""
    persona_name = random.choice(list(PERSONAS.keys()))
    persona = PERSONAS[persona_name]

    current_rmssd = persona['base_rmssd'] + random.uniform(-persona['rmssd_flex'], persona['rmssd_flex'])
    current_pv = 1.0 + random.uniform(-0.5, 0.5)

    session_data = []

    current_time = 0
    intervention_end_time = 0
    current_intervention = None

    while current_time < SESSION_DURATION_S:
        if current_time >= intervention_end_time:
            intervention_id = random.choice(INTERVENTION_IDS)
            category = get_intervention_category(intervention_id)
            effects = INTERVENTIONS[category]
            duration = random.randint(*effects['duration_range'])
            intervention_end_time = current_time + duration
            current_intervention = {'id': intervention_id, 'effects': effects}

        rmssd_change = current_intervention['effects']['rmssd_effect'] * persona['recovery_rate']
        pv_change = current_intervention['effects']['pv_effect'] * persona['arousal_sensitivity']

        current_rmssd += rmssd_change + random.uniform(-2, 2)
        current_pv += pv_change + random.uniform(-0.5, 0.5)

        current_rmssd = max(10, min(150, current_rmssd))
        current_pv = max(0.1, min(5.0, current_pv))

        session_data.append({
            'session_id': session_id,
            'timestamp': current_time,
            'archetype': persona_name,
            'intervention_id': current_intervention['id'],
            'rmssd': current_rmssd,
            'pv': current_pv,
            'gaze_stability': random.uniform(0.8, 1.0),
            'pose_adherence': random.uniform(0.7, 1.0)
        })

        current_time += TIMESTEP_S

    return pd.DataFrame(session_data)

# --- 4. Main Execution and File Output ---
def main():
    """Generates all session files."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print(f"Generating {NUM_SESSIONS} synthetic user sessions...")
    for i in tqdm(range(NUM_SESSIONS), desc="Generating Sessions"):
        session_df = generate_session(i)
        output_path = os.path.join(OUTPUT_DIR, f'session_{i}.csv')
        session_df.to_csv(output_path, index=False)

    print(f"\nSuccessfully generated {NUM_SESSIONS} session files in '{OUTPUT_DIR}'.")

if __name__ == '__main__':
    main()
