import torch
import cv2
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
from .sky_filter import remove_sky_predictions

def load_model(model_path, model_class, device='cuda'):
    """Load trained model"""
    model = model_class().to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    return model

def predict_image(model, image_path, device='cuda'):
    """Complete prediction with all improvements"""
    # Load image
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    original_size = image.shape[:2]
    
    # Prepare for model
    transform = A.Compose([
        A.Resize(512, 512),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])
    
    transformed = transform(image=image)
    input_tensor = transformed['image'].unsqueeze(0).to(device)
    
    # Predict
    with torch.no_grad():
        output = model(input_tensor)
        pred = torch.sigmoid(output).squeeze().cpu().numpy()
    
    # Convert to binary mask
    binary_mask = (pred > 0.5).astype(np.uint8)
    
    # Resize to original size
    binary_mask = cv2.resize(binary_mask, (original_size[1], original_size[0]))
    
    # Apply sky filter
    filtered_mask = remove_sky_predictions(image, binary_mask)
    
    # Calculate damage percentage
    total_pixels = filtered_mask.shape[0] * filtered_mask.shape[1]
    damage_pixels = filtered_mask.sum()
    damage_percentage = (damage_pixels / total_pixels) * 100
    
    return filtered_mask, damage_percentage