import sys
import os
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from joblib import dump  # Correctly save/load scalers

# Add project root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connect_db import fetch_damage_data, fetch_resource_data

# 1️⃣ Fetch Data from Database
print("Fetching data from the database...")
damage_data = fetch_damage_data()  # Input: Damage categories per location
resource_data = fetch_resource_data()  # Output: Available resource quantities

# 2️⃣ Ensure Data Shapes Match
print("Preparing training data...")

num_samples = len(damage_data)  # Number of damage reports
num_resources = len(resource_data)  # Number of resource types

X_train = damage_data.values  # Shape: (num_samples, 4)

# **Ensure y_train has correct shape**
# Repeat resource quantities for each damage sample to match training size
y_train = np.tile(resource_data['quantity'].values, (num_samples, 1))  # Shape: (num_samples, num_resources)

# 3️⃣ Scale the Inputs & Outputs
scaler_X = MinMaxScaler()
scaler_y = MinMaxScaler()

X_train_scaled = scaler_X.fit_transform(X_train)
y_train_scaled = scaler_y.fit_transform(y_train)

print(f"Scaled X_train shape: {X_train_scaled.shape}")  # Should be (num_samples, 4)
print(f"Scaled y_train shape: {y_train_scaled.shape}")  # Should be (num_samples, num_resources)

# 4️⃣ Define the Improved DQN Model
def create_dqn_model(input_dim, output_dim):
    model = Sequential([
        Dense(256, activation='relu', input_shape=(input_dim,)),  
        Dense(256, activation='relu'),
        Dense(128, activation='relu'),
        Dense(64, activation='relu'),
        Dense(output_dim, activation='linear')  # Output layer matches resource count
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')  # Mean Squared Error loss
    return model

# 5️⃣ Initialize & Summarize Model
print("Creating the improved model...")
input_dim = X_train_scaled.shape[1]  # Number of damage categories (4)
output_dim = y_train_scaled.shape[1]  # Number of resources to allocate
model = create_dqn_model(input_dim, output_dim)
model.summary()

# 6️⃣ Train the Model
print("Training the model...")
model.fit(X_train_scaled, y_train_scaled, epochs=500, batch_size=16, verbose=1)

# 7️⃣ Save the Trained Model & Scalers
print("Saving the trained model and scalers...")
model.save('dqn_model.h5')

# Save scalers using `joblib` (recommended)
dump(scaler_X, "scaler_X.pkl")
dump(scaler_y, "scaler_Y.pkl")

print("Model trained and saved as 'dqn_model.h5'")
print("Scalers saved as 'scaler_X.pkl' and 'scaler_Y.pkl'")
