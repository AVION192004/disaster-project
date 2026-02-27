import sys
sys.path.append('..')

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from tqdm import tqdm

from utils.losses import CombinedLoss
from models.unet import UNet

def calculate_iou(pred, target, threshold=0.5):
    """Calculate Intersection over Union"""
    pred = (pred > threshold).float()
    intersection = (pred * target).sum()
    union = pred.sum() + target.sum() - intersection
    iou = (intersection + 1e-6) / (union + 1e-6)
    return iou.item()

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    total_loss = 0.0
    total_iou = 0.0
    
    pbar = tqdm(dataloader, desc='Training')
    for images, masks in pbar:
        images, masks = images.to(device), masks.to(device)
        
        outputs = model(images)
        loss = criterion(outputs, masks)
        
        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        
        with torch.no_grad():
            pred = torch.sigmoid(outputs)
            iou = calculate_iou(pred, masks)
        
        total_loss += loss.item()
        total_iou += iou
        
        pbar.set_postfix({'loss': loss.item(), 'iou': iou})
    
    return total_loss / len(dataloader), total_iou / len(dataloader)

def validate(model, dataloader, criterion, device):
    """Validate the model"""
    model.eval()
    total_loss = 0.0
    total_iou = 0.0
    
    with torch.no_grad():
        for images, masks in tqdm(dataloader, desc='Validation'):
            images, masks = images.to(device), masks.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, masks)
            
            pred = torch.sigmoid(outputs)
            iou = calculate_iou(pred, masks)
            
            total_loss += loss.item()
            total_iou += iou
    
    return total_loss / len(dataloader), total_iou / len(dataloader)

def train_model(model, train_loader, val_loader, epochs=50, device='cuda'):
    """Complete training function"""
    criterion = CombinedLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', patience=5, factor=0.5, verbose=True
    )
    
    best_iou = 0.0
    
    for epoch in range(epochs):
        print(f'\nEpoch {epoch+1}/{epochs}')
        
        train_loss, train_iou = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_iou = validate(model, val_loader, criterion, device)
        
        scheduler.step(val_loss)
        
        print(f'Train Loss: {train_loss:.4f} | Train IoU: {train_iou:.4f}')
        print(f'Val Loss: {val_loss:.4f} | Val IoU: {val_iou:.4f}')
        
        if val_iou > best_iou:
            best_iou = val_iou
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'best_iou': best_iou,
            }, '../models/best_model.pth')
            print(f'✅ Best model saved! (IoU: {best_iou:.4f})')