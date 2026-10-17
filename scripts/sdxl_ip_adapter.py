"""
Stable Diffusion XL (SDXL) + IP-Adapter Photo-to-Image Generation Pipeline
Model: stabilityai/stable-diffusion-xl-base-1.0
IP-Adapter: h94/IP-Adapter (sdxl_models/ip-adapter_sdxl.bin)
"""

import sys
import argparse
import os

try:
    import torch
    from diffusers import StableDiffusionXLPipeline
    from diffusers.utils import load_image
    HAS_DIFFUSERS = True
except ImportError:
    HAS_DIFFUSERS = False


def generate_image_from_photo(
    input_image_path: str,
    prompt: str,
    output_image_path: str = "output.png",
    ip_adapter_scale: float = 0.7,
    negative_prompt: str = "blurry, distorted, low quality, extra limbs",
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
):
    """
    Generate an image combining a reference photo and a text prompt using SDXL + IP-Adapter.
    """
    if not HAS_DIFFUSERS:
        print("[Error] torch and diffusers must be installed to run locally: pip install diffusers torch transformers accelerate safetensors")
        return False

    # 1. Select hardware device (CUDA GPU recommended)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"Using device: {device} ({torch_dtype})")

    # 2. Load the base SDXL pipeline
    model_id = "stabilityai/stable-diffusion-xl-base-1.0"
    print(f"Loading base SDXL pipeline: {model_id}...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch_dtype, 
        use_safetensors=True
    )

    # 3. Load IP-Adapter weights (allows using an image as a prompt)
    print("Loading IP-Adapter weights (h94/IP-Adapter)...")
    pipe.load_ip_adapter(
        "h94/IP-Adapter", 
        subfolder="sdxl_models", 
        weight_name="ip-adapter_sdxl.bin"
    )
    
    # Enable memory optimizations if using a GPU
    if device == "cuda":
        pipe.to(device)
        pipe.enable_model_cpu_offload()

    # 4. Set IP-Adapter scale (0.0 to 1.0)
    # Higher values retain more features from the input photo; lower values give more weight to the prompt.
    print(f"Setting IP-Adapter scale to {ip_adapter_scale}...")
    pipe.set_ip_adapter_scale(ip_adapter_scale)

    # 5. Load user's reference photograph
    print(f"Loading input photograph: {input_image_path}...")
    ip_adapter_image = load_image(input_image_path)

    # 6. Generate the image combining the photo and text prompt
    print(f"Generating image with prompt: '{prompt}'...")
    image = pipe(
        prompt=prompt,
        ip_adapter_image=ip_adapter_image,
        negative_prompt=negative_prompt,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
    ).images[0]

    # 7. Save output
    image.save(output_image_path)
    print(f"Image successfully saved to {output_image_path}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SDXL + IP-Adapter Photo to Image Generator")
    parser.add_argument("--input", "-i", type=str, default="my_photo.jpg", help="Path to input photograph")
    parser.add_argument("--prompt", "-p", type=str, default="A high-resolution professional portrait of a person as an astronaut on Mars, cinematic lighting, photorealistic, 8k", help="Text prompt")
    parser.add_argument("--output", "-o", type=str, default="astronaut_portrait.png", help="Path to output image")
    parser.add_argument("--scale", "-s", type=float, default=0.7, help="IP-Adapter scale (0.0 to 1.0)")
    parser.add_argument("--steps", type=int, default=30, help="Inference steps")
    parser.add_argument("--guidance", type=float, default=7.5, help="Guidance scale")
    parser.add_argument("--negative", type=str, default="blurry, distorted, low quality, extra limbs", help="Negative prompt")

    args = parser.parse_args()

    if os.path.exists(args.input):
        generate_image_from_photo(
            input_image_path=args.input,
            prompt=args.prompt,
            output_image_path=args.output,
            ip_adapter_scale=args.scale,
            negative_prompt=args.negative,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance,
        )
    else:
        print(f"Example usage:\npython scripts/sdxl_ip_adapter.py --input {args.input} --prompt '{args.prompt}'")
