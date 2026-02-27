import sys
print("Testing imports...")

try:
    import torch
    print("✓ PyTorch installed")
except:
    print("✗ PyTorch missing - run: pip install torch torchvision")

try:
    import albumentations
    print("✓ Albumentations installed")
except:
    print("✗ Albumentations missing - run: pip install albumentations")

try:
    import cv2
    print("✓ OpenCV installed")
except:
    print("✗ OpenCV missing")

try:
    from utils.sky_filter import remove_sky_predictions
    print("✓ Utils module working")
except Exception as e:
    print(f"✗ Utils module error: {e}")

try:
    from models.unet import UNet
    print("✓ Models module working")
except Exception as e:
    print(f"✗ Models module error: {e}")

print("\nAll checks complete!")