import sys
import os

# Add backend folder to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from PIL import ImageFile

# Fix for corrupted/truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True


# ---------------- PATH ----------------
DATASET_PATH = rDATASET_PATH = r"C:\Users\RESHMA VARGHESE\.cache\kagglehub\datasets\sarthaktandulje\disaster-damage-5class\versions\2\disaster_dataset\disaster_dataset"

train_dir = DATASET_PATH
test_dir = DATASET_PATH   # using same data (no separate split)

# ---------------- TRANSFORMS ----------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

# ---------------- DATA LOADERS ----------------
train_dataset = datasets.ImageFolder(train_dir, transform=transform)
test_dataset = datasets.ImageFolder(test_dir, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

class_names = train_dataset.classes
print("Classes:", class_names)

# ---------------- MODEL ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, len(class_names))
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

# ---------------- TRAINING LOOP ----------------
from tqdm import tqdm

epochs = 5

for epoch in range(epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    loop = tqdm(train_loader, desc=f"Epoch [{epoch+1}/{epochs}]")

    for images, labels in loop:
        images, labels = images.to(device), labels.to(device)

        outputs = model(images)
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        # Calculate accuracy
        _, predicted = torch.max(outputs, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)

        loop.set_postfix(
            loss=loss.item(),
            accuracy=100 * correct / total
        )

    epoch_loss = running_loss / len(train_loader)
    epoch_acc = 100 * correct / total

    print(f"\nEpoch [{epoch+1}/{epochs}] Completed | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")

# ---------------- SAVE MODEL ----------------
os.makedirs("../models", exist_ok=True)
torch.save(model.state_dict(), "../models/disaster_classifier.pth")

print("✅ Model saved at backend/models/disaster_classifier.pth")