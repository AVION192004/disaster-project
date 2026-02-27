import albumentations as A
from albumentations.pytorch import ToTensorV2

def get_training_augmentation():
    """Strong augmentation for training"""
    return A.Compose([
        A.Resize(512, 512),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.3),
        A.Rotate(limit=30, p=0.5),
        A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.2, rotate_limit=30, p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
        A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=0.3),
        A.RandomFog(fog_coef_lower=0.1, fog_coef_upper=0.3, p=0.2),
        A.RandomRain(slant_lower=-10, slant_upper=10, p=0.2),
        A.OneOf([
            A.GaussianBlur(blur_limit=3, p=1.0),
            A.MotionBlur(blur_limit=3, p=1.0),
        ], p=0.2),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

def get_validation_augmentation():
    """Minimal augmentation for validation"""
    return A.Compose([
        A.Resize(512, 512),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])