import torch
import torch.nn as nn

class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super(DiceLoss, self).__init__()
        self.smooth = smooth
    
    def forward(self, pred, target):
        pred = torch.sigmoid(pred)
        pred = pred.view(-1)
        target = target.view(-1)
        
        intersection = (pred * target).sum()
        dice = (2. * intersection + self.smooth) / (pred.sum() + target.sum() + self.smooth)
        
        return 1 - dice

class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0):
        super(FocalLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.bce = nn.BCEWithLogitsLoss(reduction='none')
    
    def forward(self, pred, target):
        bce_loss = self.bce(pred, target)
        pt = torch.exp(-bce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * bce_loss
        return focal_loss.mean()

class CombinedLoss(nn.Module):
    def __init__(self, focal_weight=0.5, dice_weight=0.5):
        super(CombinedLoss, self).__init__()
        self.focal = FocalLoss()
        self.dice = DiceLoss()
        self.focal_weight = focal_weight
        self.dice_weight = dice_weight
    
    def forward(self, pred, target):
        focal_loss = self.focal(pred, target)
        dice_loss = self.dice(pred, target)
        return self.focal_weight * focal_loss + self.dice_weight * dice_loss