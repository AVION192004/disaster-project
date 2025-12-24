from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os
import sys
from tensorflow.keras.models import load_model
from joblib import load

# --------------------------------------------------
# 🔧 PATH FIX
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(BASE_DIR, "..")))

# --------------------------------------------------
# 🔧 DATABASE IMPORTS
# --------------------------------------------------
from database.connect_db import fetch_resource_data, update_resources, log_allocation

# --------------------------------------------------
# 🔧 FLASK APP
# --------------------------------------------------
app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# 🔧 CUSTOM LOSS (USED BY DQN MODEL)
# --------------------------------------------------
from tensorflow.keras.saving import register_keras_serializable

@register_keras_serializable()
def mse(y_true, y_pred):
    return tf.keras.losses.mean_squared_error(y_true, y_pred)

# --------------------------------------------------
# 🔧 LOAD MODEL & SCALERS (SAFE)
# --------------------------------------------------
try:
    print("🔍 Loading DQN model and scalers...")

    model = load_model(
        os.path.join(BASE_DIR, "dqn_model.h5"),
        custom_objects={"mse": mse},
        compile=False
    )

    scaler_X = load(os.path.join(BASE_DIR, "scaler_X.pkl"))
    scaler_Y = load(os.path.join(BASE_DIR, "scaler_Y.pkl"))

    print("✅ DQN model and scalers loaded successfully!")

except Exception as e:
    print(f"❌ Failed to load model or scalers: {e}")
    exit(1)

# --------------------------------------------------
# 🔸 DAMAGE ANALYSIS (DISABLED SAFELY)
# --------------------------------------------------
@app.route("/analyze-damage", methods=["POST"])
def analyze_damage():
    return jsonify({
        "message": "Segmentation model is disabled (model file not available)."
    })

# --------------------------------------------------
# 🔸 RESOURCE ALLOCATION API
# --------------------------------------------------
@app.route("/allocate-resources", methods=["POST"])
def allocate_resources():
    try:
        data = request.json
        print(f"📥 Input received: {data}")

        required_keys = [
            "building_no_damage",
            "building_minor_damage",
            "building_major_damage",
            "building_total_destruction"
        ]

        if not all(k in data for k in required_keys):
            return jsonify({"error": "Missing required fields"}), 400

        num_minor = int(data["building_minor_damage"])
        num_major = int(data["building_major_damage"])
        num_total = int(data["building_total_destruction"])

        damage_input = np.array([[0, num_minor, num_major, num_total]])
        damage_scaled = scaler_X.transform(damage_input)

        predicted_scaled = model.predict(damage_scaled)
        predicted_allocations = scaler_Y.inverse_transform(predicted_scaled)[0]
        predicted_allocations = np.maximum(predicted_allocations, 0).astype(int)

        resource_data = fetch_resource_data()
        if resource_data is None or resource_data.empty:
            return jsonify({"error": "No resource data in DB"}), 500

        resource_names = resource_data["resource_name"].tolist()

        total_damaged = num_minor + num_major + num_total
        results = []

        for i, qty in enumerate(predicted_allocations):
            if qty > 0:
                update_resources(resource_names[i], int(qty))
                log_allocation(1, i + 1, int(qty))
                results.append({
                    "resource_name": resource_names[i],
                    "allocated_quantity": int(qty)
                })

        updated_resources = fetch_resource_data().to_dict(orient="records")

        print("✅ Resource allocation successful")

        return jsonify({
            "allocations": results,
            "updated_resources": updated_resources
        })

    except Exception as e:
        print(f"❌ Allocation error: {e}")
        return jsonify({"error": str(e)}), 500

# --------------------------------------------------
# 🚀 START SERVER
# --------------------------------------------------
if __name__ == "__main__":
    print("🚀 API Server Running on http://127.0.0.1:5000/")
    app.run(host="0.0.0.0", port=5000, debug=True)
