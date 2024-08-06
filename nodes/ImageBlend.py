from .imagefunc import *

NODE_NAME = 'ImageBlend'

class GddsImageBlend:

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        mirror_mode = ['None', 'horizontal', 'vertical']
        method_mode = ['lanczos', 'bicubic', 'hamming', 'bilinear', 'box', 'nearest']
        return {
            "required": {
                "background_image": ("IMAGE",),
                "layer_image": ("IMAGE",),
                "invert_mask": ("BOOLEAN", {"default": True}),
                "blend_mode": (chop_mode_v2,),
                "opacity": ("INT", {"default": 100, "min": 0, "max": 100, "step": 1}),
                "mirror": (mirror_mode,),
                "rotate": ("FLOAT", {"default": 0, "min": -999999, "max": 999999, "step": 0.01}),
                "transform_method": (method_mode,),
                "anti_aliasing": ("INT", {"default": 0, "min": 0, "max": 16, "step": 1}),
                "max_top_percent": ("FLOAT", {"default": 0, "min": 0, "max": 100, "step": 0.01}),
                "max_bottom_percent": ("FLOAT", {"default": 0, "min": 0, "max": 100, "step": 0.01}),
                "max_left_percent": ("FLOAT", {"default": 0, "min": 0, "max": 100, "step": 0.01}),
                "max_right_percent": ("FLOAT", {"default": 0, "min": 0, "max": 100, "step": 0.01}),
            },
            "optional": {
                "layer_mask": ("MASK",),
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK", "IMAGE")
    RETURN_NAMES = ("image", "mask", "debug_image")
    FUNCTION = 'image_blend_advance_v2'
    CATEGORY = '🐶gdds'

    def image_blend_advance_v2(self, background_image, layer_image,
                               invert_mask, blend_mode, opacity,
                               mirror, rotate,
                               transform_method, anti_aliasing,
                               max_top_percent, max_bottom_percent, max_left_percent, max_right_percent,
                               layer_mask=None):
        b_images = [torch.unsqueeze(b, 0) for b in background_image]
        l_images = [torch.unsqueeze(l, 0) for l in layer_image]
        l_masks = []

        for l in layer_image:
            m = tensor2pil(l)
            if m.mode == 'RGBA':
                l_masks.append(m.split()[-1])
            else:
                l_masks.append(Image.new('L', m.size, 'white'))

        if layer_mask is not None:
            if layer_mask.dim() == 2:
                layer_mask = torch.unsqueeze(layer_mask, 0)
            l_masks = []
            for m in layer_mask:
                if invert_mask:
                    m = 1 - m
                l_masks.append(tensor2pil(torch.unsqueeze(m, 0)).convert('L'))

        max_batch = max(len(b_images), len(l_images), len(l_masks))
        ret_images, ret_masks, debug_images = [], [], []

        for i in range(max_batch):
            background_image = b_images[i] if i < len(b_images) else b_images[-1]
            layer_image = l_images[i] if i < len(l_images) else l_images[-1]
            _mask = l_masks[i] if i < len(l_masks) else l_masks[-1]

            _canvas = tensor2pil(background_image).convert('RGB')
            _layer = tensor2pil(layer_image)

            if _mask.size != _layer.size:
                _mask = Image.new('L', _layer.size, 'white')
                log(f"Warning: {NODE_NAME} mask mismatch, dropped!", message_type='warning')

            orig_layer_width = _layer.width
            orig_layer_height = _layer.height
            _mask = _mask.convert("RGB")

            max_left = int(_canvas.width * max_left_percent / 100)
            max_right = int(_canvas.width * max_right_percent / 100)
            max_top = int(_canvas.height * max_top_percent / 100)
            max_bottom = int(_canvas.height * max_bottom_percent / 100)

            log(f"Original layer size: ({orig_layer_width}, {orig_layer_height})", message_type='info')

            available_width_left = max_left
            available_width_right =  max_right
            available_height_top = max_top
            available_height_bottom =  max_bottom

            available_width = available_width_right - available_width_left
            available_height = available_height_bottom - available_height_top

            scale_width = available_width / orig_layer_width
            scale_height = available_height / orig_layer_height
            scale = min(scale_width, scale_height)

            target_layer_width = int(orig_layer_width * scale)
            target_layer_height = int(orig_layer_height * scale)

            center_x = available_width_left + available_width // 2
            center_y = available_height_top + available_height // 2

            log(f"Adjusted target layer size: ({target_layer_width}, {target_layer_height})", message_type='info')

            if mirror == 'horizontal':
                _layer = _layer.transpose(Image.FLIP_LEFT_RIGHT)
                _mask = _mask.transpose(Image.FLIP_LEFT_RIGHT)
            elif mirror == 'vertical':
                _layer = _layer.transpose(Image.FLIP_TOP_BOTTOM)
                _mask = _mask.transpose(Image.FLIP_TOP_BOTTOM)

            _layer = _layer.resize((target_layer_width, target_layer_height))
            _mask = _mask.resize((target_layer_width, target_layer_height))

            _layer, _mask, _ = image_rotate_extend_with_alpha(_layer, rotate, _mask, transform_method, anti_aliasing)

            x = center_x - _layer.width // 2
            y = center_y - _layer.height // 2

            log(f"Layer position: ({x}, {y})", message_type='info')

            _comp = copy.copy(_canvas)
            _compmask = Image.new("RGB", _comp.size, color='black')
            _comp.paste(_layer, (x, y))
            _compmask.paste(_mask, (x, y))
            _compmask = _compmask.convert('L')
            _comp = chop_image_v2(_canvas, _comp, blend_mode, opacity)

            _canvas.paste(_comp, mask=_compmask)

            ret_images.append(pil2tensor(_canvas))
            ret_masks.append(image2mask(_compmask))

            debug_img = _canvas.copy()
            draw = ImageDraw.Draw(debug_img)
            draw.rectangle([(max_left, max_top), (max_right, max_bottom)], outline="red", width=2)
            draw.rectangle([(x, y), (x + _layer.width, y + _layer.height)], outline="green", width=2)
            debug_images.append(pil2tensor(debug_img))

        log(f"{NODE_NAME} Processed {len(ret_images)} image(s).", message_type='finish')
        return torch.cat(ret_images, dim=0), torch.cat(ret_masks, dim=0), torch.cat(debug_images, dim=0)

