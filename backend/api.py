from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import tensorflow as tf
import sys
import os
import base64
from tensorflow.keras.models import load_model
from joblib import load

# ✅ Fix Import Path Issue
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.connect_db import fetch_resource_data, update_resources, log_allocation
from custom_layer import SkipConnLayer, AttentionLayer, MyMeanIOU  # ✅ Import custom layers

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# ✅ Register Custom Objects for Model Loading
custom_objects = {
    "SkipConnLayer": SkipConnLayer,
    "AttentionLayer": AttentionLayer,
    "MyMeanIOU": MyMeanIOU
}

from tensorflow.keras.losses import MeanSquaredError
from tensorflow.keras.saving import register_keras_serializable

@register_keras_serializable()
def mse(y_true, y_pred):
    return tf.keras.losses.mean_squared_error(y_true, y_pred)

# ✅ Load trained models and scalers
try:
    print("🔍 Loading trained models and scalers...")

    # Load DQN model (for resource allocation)
    model = load_model("dqn_model.h5", custom_objects={"mse": mse})
    scaler_X = load("scaler_X.pkl")
    scaler_Y = load("scaler_Y.pkl")

    # Load Segmentation Model (for damage assessment)
    with tf.keras.utils.custom_object_scope(custom_objects):
        segmentation_model = load_model("model.h5", compile=False)

    print("✅ Models and scalers loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models or scalers: {e}")
    exit(1)

# ------------------------------
# 🔹 SEGMENTATION & DAMAGE COUNT
# ------------------------------
def create_overlay(original, mask):
    color_map = {
        3: (0, 255, 0),     # No Damage
        4: (255, 255, 0),   # Minor Damage
        5: (255, 165, 0),   # Major Damage
        6: (255, 0, 0)      # Complete Destruction
    }

    overlay = original.copy()

    for class_id, color in color_map.items():
        binary_mask = (mask == class_id).astype(np.uint8) * 255
        binary_mask = cv2.medianBlur(binary_mask, 5)
        overlay[binary_mask > 0] = color

    blended = cv2.addWeighted(original, 0.6, overlay, 0.4, 0)
    return blended
@app.route("/analyze-damage", methods=["POST"])
def analyze_damage():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided."}), 400

        file = request.files["image"]

        # ✅ STEP 1: CONTEXT INPUT
        disaster_type = request.form.get("disaster_type")
        location = request.form.get("location")
        timestamp = request.form.get("timestamp")

        print("📍 Disaster Type:", disaster_type)
        print("📍 Location:", location)
        print("📍 Timestamp:", timestamp)

        image_np = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_resized = cv2.resize(image, (480, 360))
        image_normalized = image_resized / 255.0
        image_input = np.expand_dims(image_normalized, axis=0)

        segmentation_output = segmentation_model.predict(image_input)[0]
        predicted_mask = segmentation_output.argmax(axis=-1).astype(np.uint8)
        overlay_image = create_overlay(image_resized, predicted_mask)
        overlay_bgr = cv2.cvtColor(overlay_image, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode(".png", overlay_bgr)
        overlay_base64 = base64.b64encode(buffer).decode("utf-8")

        building_classes = {
            "building_no_damage": 3,
            "building_minor_damage": 4,
            "building_major_damage": 5,
            "building_complete_destruction": 6
        }

        def count_buildings(mask, class_id, min_size=2000):
            binary_mask = (mask == class_id).astype(np.uint8)
            kernel = np.ones((5, 5), np.uint8)
            binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
            binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)

            num_labels, labels = cv2.connectedComponents(binary_mask)
            count = 0
            for i in range(1, num_labels):
                component = (labels == i).astype(np.uint8)
                if cv2.countNonZero(component) >= min_size:
                    count += 1
            return count

        results = {
            label: int(count_buildings(predicted_mask, class_id))
            for label, class_id in building_classes.items()
        }

        return jsonify({
            **results,
            "overlay_image": overlay_base64,
            "disaster_type": disaster_type,
            "location": location,
            "timestamp": timestamp
        })

    except Exception as e:
        print(f"❌ Error during damage analysis: {e}")
        return jsonify({"error": str(e)}), 500
# ------------------------------
# 🔸 RESOURCE ALLOCATION SECTION
# ------------------------------
@app.route("/allocate-resources", methods=["POST"])
def allocate_resources():
    try:
        data = request.json
        print(f"📥 Received Input: {data}")

        required_keys = ["building_no_damage", "building_minor_damage", "building_major_damage", "building_total_destruction"]
        if not all(key in data for key in required_keys):
            return jsonify({"error": "Invalid input format. Missing required fields."}), 400

        num_minor = int(data["building_minor_damage"])
        num_major = int(data["building_major_damage"])
        num_total = int(data["building_total_destruction"])

        damage_input = np.array([[0, num_minor, num_major, num_total]])
        damage_scaled = scaler_X.transform(damage_input)
        predicted_scaled = model.predict(damage_scaled)
        predicted_allocations = scaler_Y.inverse_transform(predicted_scaled)[0]
        predicted_allocations = np.maximum(predicted_allocations, 0).astype(int).tolist()

        resource_data = fetch_resource_data()
        if resource_data is None or resource_data.empty:
            return jsonify({"error": "Resource data unavailable in the database."}), 500

        resource_names = resource_data["resource_name"].tolist()

        total_damaged_buildings = num_minor + num_major + num_total
        minor_allocations, major_allocations, total_allocations = [], [], []

        if total_damaged_buildings > 0:
            for allocated_quantity in predicted_allocations:
                minor_share = (num_minor / total_damaged_buildings) * allocated_quantity if num_minor > 0 else 0
                major_share = (num_major / total_damaged_buildings) * allocated_quantity if num_major > 0 else 0
                total_share = allocated_quantity - (int(minor_share) + int(major_share))

                minor_allocations.append(int(minor_share))
                major_allocations.append(int(major_share))
                total_allocations.append(int(total_share))

        allocation_results = {
            "minor_damage": [{"resource_name": resource_names[i], "allocated_quantity": minor_allocations[i]} for i in range(len(resource_names)) if minor_allocations[i] > 0],
            "major_damage": [{"resource_name": resource_names[i], "allocated_quantity": major_allocations[i]} for i in range(len(resource_names)) if major_allocations[i] > 0],
            "total_destruction": [{"resource_name": resource_names[i], "allocated_quantity": total_allocations[i]} for i in range(len(resource_names)) if total_allocations[i] > 0]
        }

        for i, resource_name in enumerate(resource_names):
            allocated_quantity = minor_allocations[i] + major_allocations[i] + total_allocations[i]
            if allocated_quantity > 0:
                update_resources(resource_name, int(allocated_quantity))
                log_allocation(1, i + 1, int(allocated_quantity))

        updated_resources = fetch_resource_data().to_dict(orient="records")

        print("✅ Resource Allocation Successful!")
        return jsonify({
            "allocation_results": allocation_results,
            "updated_resources": updated_resources,
             "building_no_damage": no_damage,
            "building_minor_damage": minor_damage,
             "building_major_damage": major_damage,
               "building_complete_destruction": complete_destruction,
             "disaster_type": disaster_type,
             "location": location,
             "timestamp": timestamp
        })

    except Exception as e:
        print(f"❌ Error during resource allocation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 API Server Running on http://127.0.0.1:5000/")
    app.run(host="0.0.0.0", port=5000, debug=True)