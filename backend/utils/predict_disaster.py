import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

# Class labels (same order as training)
class_names = ['earthquake', 'fire', 'flood', 'landslide', 'normal', 'smoke']

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, len(class_names))
model.load_state_dict(torch.load("backend/models/disaster_classifier.pth", map_location=device))
model = model.to(device)
model.eval()

# Image transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def predict_image(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probs, 1)

    return class_names[predicted.item()], confidence.item() * 100