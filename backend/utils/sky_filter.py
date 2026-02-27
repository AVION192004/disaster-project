import cv2
import numpy as np

def remove_sky_predictions(image, prediction_mask):
    """
    Remove predictions from sky area
    
    Args:
        image: Original image (numpy array, shape: H x W x 3)
        prediction_mask: Binary mask from model (numpy array, shape: H x W)
    
    Returns:
        filtered_mask: Cleaned prediction mask
    """
    h, w = prediction_mask.shape
    
    # Step 1: Remove top 35% of image (usually sky)
    sky_boundary = int(h * 0.35)
    filtered_mask = prediction_mask.copy()
    filtered_mask[:sky_boundary, :] = 0
    
    # Step 2: Detect sky using color
    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    
    # Sky color ranges
    lower_sky = np.array([90, 0, 100])
    upper_sky = np.array([130, 100, 255])
    
    sky_mask = cv2.inRange(hsv, lower_sky, upper_sky)
    
    # Step 3: Remove predictions where sky is detected
    filtered_mask[sky_mask > 0] = 0
    
    # Step 4: Remove small noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    filtered_mask = cv2.morphologyEx(filtered_mask, cv2.MORPH_OPEN, kernel)
    
    return filtered_mask