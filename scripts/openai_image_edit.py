"""
AI Image Generation & Photo-to-Image Pipeline via OpenAI Images API
Models supported: gpt-image-1, dall-e-2, dall-e-3
Features:
- Loads image from local path, base64, or URL
- Pads image onto a 1:1 RGBA square canvas
- Calls OpenAI client.images.edit() with prompt conditioning
- Decodes and saves output image
"""

import base64
import io
import os
import sys
import argparse
import requests
from PIL import Image

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

client = OpenAI() if HAS_OPENAI else None


def prepare_image(image_path_or_url: str) -> io.BytesIO:
    """Loads an image from a local file path or web URL, converts it to square PNG,
    and returns it as a BytesIO stream in memory.
    """
    if image_path_or_url.startswith("http://") or image_path_or_url.startswith("https://"):
        response = requests.get(image_path_or_url)
        img = Image.open(io.BytesIO(response.content))
    elif image_path_or_url.startswith("data:image"):
        # Handle base64 data URLs
        header, base64_data = image_path_or_url.split(",", 1)
        image_data = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(image_data))
    else:
        img = Image.open(image_path_or_url)

    # Convert image to RGBA and make it a 1:1 square canvas
    img = img.convert("RGBA")
    max_dim = max(img.size)
    
    square_img = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    # Center the original image on the square canvas
    offset = ((max_dim - img.width) // 2, (max_dim - img.height) // 2)
    square_img.paste(img, offset)

    # Save to BytesIO buffer as PNG
    byte_stream = io.BytesIO()
    square_img.save(byte_stream, format="PNG")
    byte_stream.seek(0)
    byte_stream.name = "input.png"
    return byte_stream


def generate_image_from_photo(
    input_source: str, 
    prompt: str, 
    output_path: str = "generated_image.png",
    model: str = "gpt-image-1"
):
    if not HAS_OPENAI:
        print("[Error] openai python package not found. Run: pip install openai pillow requests")
        return None

    if not os.environ.get("OPENAI_API_KEY"):
        print("[Notice] OPENAI_API_KEY environment variable is not set. Please set your key.")

    print("Preparing image...")
    image_stream = prepare_image(input_source)

    print(f"Generating new image via OpenAI API ({model})...")
    # Use gpt-image-1 (or dall-e-2) depending on your access
    try:
        response = client.images.edit(
            model=model,  # You can also use "dall-e-2"
            image=image_stream,
            prompt=prompt,
            size="1024x1024",
            response_format="b64_json"
        )
    except Exception as e:
        print(f"Primary model {model} notice: {e}. Retrying with dall-e-2...")
        image_stream.seek(0)
        response = client.images.edit(
            model="dall-e-2",
            image=image_stream,
            prompt=prompt,
            size="1024x1024",
            response_format="b64_json"
        )

    # Decode and save the output image
    image_bytes = base64.b64decode(response.data[0].b64_json)
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    print(f"Success! Image saved to {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate AI image from photo via OpenAI API")
    parser.add_argument("--input", "-i", type=str, help="Path or URL to input photo")
    parser.add_argument("--prompt", "-p", type=str, help="Text prompt for image transformation")
    parser.add_argument("--output", "-o", type=str, default="generated_image.png", help="Output file path")
    parser.add_argument("--model", "-m", type=str, default="gpt-image-1", help="OpenAI image model (gpt-image-1 or dall-e-2)")
    args = parser.parse_args()

    photo_input = args.input
    user_prompt = args.prompt

    # Interactive prompt if CLI arguments not given
    if not photo_input:
        photo_input = input("Enter image path or URL: ").strip('"\'')
    if not user_prompt:
        user_prompt = input("Enter prompt (e.g., 'Turn this person into a cyberpunk warrior in neon city'): ")

    try:
        generate_image_from_photo(photo_input, user_prompt, args.output, args.model)
    except Exception as e:
        print(f"\nError: {e}")
