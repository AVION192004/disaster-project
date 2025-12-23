import sys
import os
import numpy as np
from tensorflow.keras.models import load_model
from joblib import load  # Correct method for loading scalers

# Add project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connect_db import fetch_damage_data, fetch_resource_data, update_resources, log_allocation

# 1️⃣ Load the Trained Model
print("Loading trained DQN model...")
custom_objects = {"mse": "mse"}  # Ensure MSE is recognized
model = load_model("dqn_model.h5", custom_objects=custom_objects)

# 2️⃣ Load the Saved Scalers
print("Loading scalers for data transformation...")
scaler_X = load("scaler_X.pkl")
scaler_Y = load("scaler_Y.pkl")

# 3️⃣ Fetch Live Damage Data
print("Fetching latest damage data from database...")
damage_data = fetch_damage_data()  # Live data from `damage_assessment` table

if damage_data is None or damage_data.empty:
    print("No damage data found in the database.")
    sys.exit()

# Drop `damage_id` before scaling since it wasn't part of training features
damage_input = damage_data.drop(columns=["damage_id"])

# Convert fetched data into NumPy array and scale it
damage_input_scaled = scaler_X.transform(damage_input.values)

# 4️⃣ Run Predictions Using the Model
print("\n **Running Resource Allocation Predictions...**\n")
predictions_scaled = model.predict(damage_input_scaled)

# Convert predictions back to actual resource values
predicted_allocations = scaler_Y.inverse_transform(predictions_scaled)

# Ensure no negative resource allocations (set negatives to zero and convert to integer)
predicted_allocations = np.maximum(predicted_allocations, 0).astype(int)

# 5️⃣ Fetch Resource Names & IDs from Database
resource_data = fetch_resource_data()
resource_names = resource_data['resource_name'].tolist()  # Get resource names
resource_ids = resource_data['resource_id'].tolist()  # Get resource IDs

# 6️⃣ Store Allocations & Update Resources
for damage_idx, (damage_row, allocations) in enumerate(zip(damage_input.values, predicted_allocations)):
    damage_id = damage_data.iloc[damage_idx]['damage_id']  # Fetch corresponding `damage_id`
    print(f" **Damage Report {damage_idx + 1}:** Input = {damage_row}")
    print(" **Allocated Resources:**")
    
    for resource_idx, (resource_name, resource_id, allocation) in enumerate(zip(resource_names, resource_ids, allocations)):
        print(f"  - {resource_name}: {allocation} units")
        
        # **Update the database**
        try:
            update_resources(resource_name, int(allocation))  # Deduct allocated resources
            log_allocation(damage_id, resource_id, int(allocation))  # Log allocation
        except Exception as e:
            print(f" Error updating allocation for {resource_name}: {e}")

    print("\n" + "━" * 50 + "\n")

print("Resource allocations updated in the database successfully!")
