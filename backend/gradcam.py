import torch
import torch.nn.functional as F
import numpy as np
import cv2

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.target_layer.register_forward_hook(self._save_activation)
        self.target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx=None):
        self.model.eval()
        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = output.argmax(dim=1).item()
        self.model.zero_grad()
        one_hot = torch.zeros_like(output)
        one_hot[0][class_idx] = 1.0
        output.backward(gradient=one_hot)

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)

        # Normalize
        cam = cam.squeeze().cpu().numpy()
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)

        # Sharpen: raise to power to suppress weak activations
        # This removes the diffuse background glow you're seeing
        cam = np.power(cam, 1.5)
        cam = cam / (cam.max() + 1e-8)

        return cam

    def overlay_on_image(self, original_image_bgr, cam, alpha=0.5):
        h, w = original_image_bgr.shape[:2]
        cam_resized = cv2.resize(cam, (w, h))

        # Threshold: zero out anything below 40% activation
        # This stops weak sky/background areas from showing red
        cam_resized = np.where(cam_resized < 0.4, 0, cam_resized)

        # Renormalize after threshold
        if cam_resized.max() > 0:
            cam_resized = cam_resized / cam_resized.max()

        heatmap = cv2.applyColorMap(
            np.uint8(255 * cam_resized),
            cv2.COLORMAP_JET
        )

        # Only blend where activation is strong (mask weak areas)
        mask = (cam_resized > 0.1).astype(np.float32)
        mask = np.stack([mask, mask, mask], axis=2)

        overlaid = original_image_bgr.copy().astype(np.float32)
        overlaid = overlaid * (1 - mask * alpha) + heatmap.astype(np.float32) * mask * alpha
        overlaid = np.clip(overlaid, 0, 255).astype(np.uint8)

        return overlaid


def get_gradcam_target_layer(model):
    # blocks[-3] gives better spatial resolution for structural damage detection
    # It's abstract enough to understand damage but sharp enough to localize it
    return model.blocks[-3]