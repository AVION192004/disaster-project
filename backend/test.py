from tensorflow.keras.models import load_model

try:
    model = load_model("model.h5")  # Adjust path if needed
    print("✅ Model loaded successfully! No custom objects required.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
