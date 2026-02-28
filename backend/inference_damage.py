import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
import base64
import timm
from PIL import Image
from torchvision import transforms
from gradcam import GradCAM, get_gradcam_target_layer

DAMAGE_LABELS = {
    0: "No Damage",
    1: "Major Damage",
    2: "Destroyed"
}

CLASS_COLORS = {
    0: "#28a745",   # green
    1: "#fd7e14",   # orange
    2: "#dc3545"    # red
}


class DamageAssessor:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model, self.class_names = self._load_model(model_path)
        self.gradcam = GradCAM(self.model, get_gradcam_target_layer(self.model))
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])
        print(f"DamageAssessor ready on {self.device}")

    def _load_model(self, path):
        checkpoint = torch.load(path, map_location=self.device)
        class_names = checkpoint.get("class_names", ['0_no_damage', '2_major_damage', '3_destroyed'])
        num_classes = len(class_names)

        model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=0)
        in_features = model.num_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes)
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(self.device)
        model.eval()
        return model, class_names

    def predict(self, image_path: str) -> dict:
        # Load image
        pil_image = Image.open(image_path).convert("RGB")
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

        # Preprocess
        input_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)

        # Prediction
        with torch.no_grad():
            logits = self.model(input_tensor)

        probabilities = F.softmax(logits, dim=1)[0]
        predicted_idx = probabilities.argmax().item()
        confidence = probabilities[predicted_idx].item() * 100

        # Map class index to label
        raw_class = self.class_names[predicted_idx]
        if '0_no_damage' in raw_class:
            label = "No Damage"
            damage_level = 0
        elif '2_major_damage' in raw_class:
            label = "Major Damage"
            damage_level = 2
        else:
            label = "Destroyed"
            damage_level = 3

        # Grad-CAM
        input_tensor_grad = self.transform(pil_image).unsqueeze(0).to(self.device)
        cam = self.gradcam.generate(input_tensor_grad, class_idx=predicted_idx)
        overlay = self.gradcam.overlay_on_image(cv_image, cam)

        # Encode to base64
        _, buffer = cv2.imencode(".jpg", overlay)
        heatmap_b64 = base64.b64encode(buffer).decode("utf-8")

        # All probabilities
        all_probs = {}
        for i, cls in enumerate(self.class_names):
            if '0_no_damage' in cls:
                all_probs["No Damage"] = round(probabilities[i].item() * 100, 2)
            elif '2_major_damage' in cls:
                all_probs["Major Damage"] = round(probabilities[i].item() * 100, 2)
            else:
                all_probs["Destroyed"] = round(probabilities[i].item() * 100, 2)

        return {
            "predicted_label": label,
            "damage_level": damage_level,
            "confidence": round(confidence, 2),
            "color": CLASS_COLORS.get(damage_level, "#ffffff"),
            "all_probabilities": all_probs,
            "gradcam_heatmap_b64": heatmap_b64,
        }


# Quick test
if __name__ == "__main__":
    import sys
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not image_path:
        print("Usage: python inference_damage.py path/to/image.jpg")
        exit()
    assessor = DamageAssessor("best_model.pth")
    result = assessor.predict(image_path)
    print(f"Label      : {result['predicted_label']}")
    print(f"Damage Level: {result['damage_level']}")
    print(f"Confidence : {result['confidence']}%")
    print(f"All Probs  : {result['all_probabilities']}")
    print(f"Heatmap    : {len(result['gradcam_heatmap_b64'])} bytes (base64)")