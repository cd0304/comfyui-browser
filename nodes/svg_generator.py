import svgwrite
from PIL import Image, ImageDraw
import numpy as np
import torch

class SVGGenerator:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "width": ("INT", {"default": 200, "min": 1, "max": 1000}),
                "height": ("INT", {"default": 50, "min": 1, "max": 1000}),
                "color_start": ("STRING", {"default": "#FF0000"}),
                "color_end": ("STRING", {"default": "#0000FF"}),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    FUNCTION = "generate_and_convert_svg"
    CATEGORY = "gdds"

    def generate_svg(self, width, height, color_start, color_end):
        dwg = svgwrite.Drawing(size=(width, height))
        gradient = dwg.linearGradient((0, 0), (1, 0))
        gradient.add_stop_color(0, color_start)
        gradient.add_stop_color(1, color_end)
        dwg.defs.add(gradient)
        
        dwg.add(dwg.rect(insert=(0, 0), size=(width, height), rx=height/2, ry=height/2, fill=gradient.get_paint_server()))
        
        svg_data = dwg.tostring()
        return svg_data

    def svg_to_png(self, svg_data, width, height, color_start, color_end):
        # Increase resolution for antialiasing
        scale_factor = 8
        temp_width = width * scale_factor
        temp_height = height * scale_factor

        # Create an image with a transparent background at increased resolution
        temp_image = Image.new("RGBA", (temp_width, temp_height), (255, 255, 255, 0))
        draw = ImageDraw.Draw(temp_image)

        # Draw the rounded rectangle with gradient on the high-resolution image
        gradient = Image.new("RGBA", (temp_width, temp_height), color=0)
        for x in range(temp_width):
            ratio = x / temp_width
            r = int(int(color_start[1:3], 16) * (1 - ratio) + int(color_end[1:3], 16) * ratio)
            g = int(int(color_start[3:5], 16) * (1 - ratio) + int(color_end[3:5], 16) * ratio)
            b = int(int(color_start[5:7], 16) * (1 - ratio) + int(color_end[5:7], 16) * ratio)
            ImageDraw.Draw(gradient).line([(x, 0), (x, temp_height)], fill=(r, g, b, 255))

        mask = Image.new("L", (temp_width, temp_height), 0)
        draw_mask = ImageDraw.Draw(mask)
        draw_mask.rounded_rectangle([(0, 0), (temp_width, temp_height)], radius=temp_height//2, fill=255)
        temp_image.paste(gradient, (0, 0), mask)

        # Resize the high-resolution image to the desired size using Lanczos resampling
        image = temp_image.resize((width, height), resample=Image.LANCZOS)

        return image

    def png_to_tensor(self, image):
        image_np = np.array(image).astype(np.float32) / 255.0
        tensor = torch.from_numpy(image_np).permute(2, 0, 1).unsqueeze(0)  # Convert to CHW format and add batch dimension
        return tensor
    def pil2tensor(self,image: Image.Image) -> torch.Tensor:
        return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)

    def generate_and_convert_svg(self, width, height, color_start, color_end):
        # preview_images = []
        svg_data = self.generate_svg(width, height, color_start, color_end)
        png_image = self.svg_to_png(svg_data, width, height, color_start, color_end)
        tensor_image = self.pil2tensor(png_image)
        # preview_images.append(tensor_image)
        # Extract the alpha channel as the mask
        mask = np.array(png_image)[:, :, 3]  # Extract the Alpha channel
        mask_tensor = torch.from_numpy(mask.astype(np.float32) / 255.0).unsqueeze(0).unsqueeze(0)  # Convert to tensor and add dimensions
        
        return (tensor_image,mask_tensor)