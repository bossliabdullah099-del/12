// Clean export of the fixed, production-grade Python Flask + Google Veo 3.1 app.py script
export const FLASK_VIDEO_APP_PY = `# app.py
# AI Video Generator — Prompt + Image → Video (Powered by Google Veo & Google GenAI)
#
# Install dependencies:
# pip install flask google-genai python-dotenv requests
#
# Set your API key in .env or your terminal:
# export GEMINI_API_KEY="your_gemini_api_key_here"
# (or in Windows PowerShell: $env:GEMINI_API_KEY="your_api_key_here")

import os
import time
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder="static")

# Ensure static videos directory exists
VIDEOS_DIR = Path("static") / "videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

# Google GenAI API Key resolution (supports GEMINI_API_KEY and VIDEO_API_KEY)
def get_api_key(req=None):
    if req and req.form.get("api_key"):
        return req.form.get("api_key").strip()
    if req and req.headers.get("x-gemini-api-key"):
        return req.headers.get("x-gemini-api-key").strip()
    return os.getenv("GEMINI_API_KEY") or os.getenv("VIDEO_API_KEY")

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Video Generator — Google Veo 3.1</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0b0b12;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 30px 16px;
        }

        .container {
            width: 100%;
            max-width: 860px;
            background: #141420;
            border: 1px solid #28283a;
            padding: 36px;
            border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.65), 0 0 100px rgba(99,102,241,0.08);
        }

        .header {
            text-align: center;
            margin-bottom: 28px;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #a5b4fc, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }

        .header p {
            color: #9ca3af;
            font-size: 14px;
        }

        .badge {
            display: inline-block;
            background: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.3);
            color: #a5b4fc;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .presets {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }

        .preset-btn {
            background: #1e1e30;
            border: 1px solid #32324a;
            color: #cbd5e1;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .preset-btn:hover {
            background: #2a2a44;
            border-color: #6366f1;
            color: #fff;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #cbd5e1;
            margin-bottom: 8px;
        }

        textarea {
            width: 100%;
            height: 120px;
            resize: vertical;
            background: #090910;
            border: 1px solid #2d2d40;
            border-radius: 14px;
            color: white;
            padding: 14px;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s;
            font-family: inherit;
        }

        textarea:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 18px;
        }

        @media (max-width: 640px) {
            .grid-2 { grid-template-columns: 1fr; }
        }

        .file-upload-box {
            background: #090910;
            border: 1px dashed #34344e;
            border-radius: 14px;
            padding: 16px;
            text-align: center;
            position: relative;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        .file-upload-box:hover {
            border-color: #6366f1;
        }

        input[type=file] {
            display: none;
        }

        .preview-container {
            display: none;
            margin-top: 10px;
            position: relative;
        }

        .preview-img {
            max-height: 100px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid #333;
        }

        .remove-img-btn {
            position: absolute;
            top: -6px;
            right: calc(50% - 60px);
            background: #ef4444;
            color: white;
            border: 0;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .key-input {
            width: 100%;
            background: #090910;
            border: 1px solid #2d2d40;
            border-radius: 14px;
            color: white;
            padding: 12px 14px;
            font-size: 13px;
            outline: none;
        }

        .key-input:focus {
            border-color: #6366f1;
        }

        .btn-generate {
            width: 100%;
            margin-top: 24px;
            padding: 16px;
            border: 0;
            border-radius: 14px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 20px rgba(99,102,241,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .btn-generate:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(99,102,241,0.45);
        }

        .btn-generate:disabled {
            background: #2a2a3e;
            color: #71717a;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
        }

        #status {
            text-align: center;
            margin: 20px 0 10px 0;
            font-size: 14px;
            min-height: 24px;
            color: #94a3b8;
        }

        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.2);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
            margin-right: 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .video-box {
            display: none;
            margin-top: 20px;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #2d2d40;
            background: #000;
        }

        video {
            width: 100%;
            display: block;
            border-radius: 16px;
            outline: none;
        }

        .download-btn {
            display: none;
            margin-top: 16px;
            padding: 12px 20px;
            background: #1e1e2f;
            border: 1px solid #3b3b55;
            color: #a5b4fc;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            transition: all 0.2s;
        }

        .download-btn:hover {
            background: #27273e;
            color: #fff;
            border-color: #6366f1;
        }
    </style>
</head>

<body>

<div class="container">

    <div class="header">
        <div class="badge">Google Veo 3.1 & GenAI Engine</div>
        <h1>AI Video Generator</h1>
        <p>Transform cinematic prompts and starting frames into 8-second AI videos</p>
    </div>

    <div class="presets">
        <button class="preset-btn" onclick="setPreset('A mysterious cyberpunk detective walks through neon-lit rainy Tokyo alleyways at midnight. Wet asphalt reflects holographic signs. Cinematic 8k, slow dolly push.')">🌧️ Cyberpunk Detective</button>
        <button class="preset-btn" onclick="setPreset('Drone flyover through glowing crystalline glacial caves with bioluminescent ice formations and flowing azure water.')">❄️ Glacial Caves</button>
        <button class="preset-btn" onclick="setPreset('Futuristic hypercar drifting at sunset through mountain switchbacks, lens flares, ultra-realistic motion blur.')">🏎️ Sunset Drift</button>
        <button class="preset-btn" onclick="setPreset('Ancient mystical pagoda floating high above sakura cherry blossom clouds at sunrise, petals drifting in wind.')">🌸 Floating Temple</button>
    </div>

    <label for="prompt">Video Prompt</label>
    <textarea id="prompt" placeholder="Describe the scene in cinematic detail (lighting, camera motion, atmosphere)...">Create a cinematic 8-second video. A mysterious man walks through a dark futuristic city at night. Rain falls heavily. Neon lights reflect on the wet streets. The camera slowly moves toward him. Ultra-realistic cinematic photography, dramatic lighting, shallow depth of field, realistic movement, 4K quality.</textarea>

    <div class="grid-2">
        <div>
            <label>Starting Frame (Image-to-Video, Optional)</label>
            <div class="file-upload-box" onclick="document.getElementById('image').click()">
                <span id="upload-label">📁 Click or drop an image here</span>
                <input id="image" type="file" accept="image/*" onchange="previewImage(this)">
                <div id="preview-container" class="preview-container">
                    <img id="preview-img" class="preview-img" alt="Starting Frame">
                    <button type="button" class="remove-img-btn" onclick="event.stopPropagation(); removeImage();">×</button>
                </div>
            </div>
        </div>

        <div>
            <label for="api_key">Gemini API Key (Optional if set in .env)</label>
            <input id="api_key" type="password" class="key-input" placeholder="AIzaSy... (leave blank to use server .env)">
            <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
                Models used: <code>veo-3.1-generate-preview</code> with prompt + image support.
            </p>
        </div>
    </div>

    <button id="btn-submit" class="btn-generate" onclick="generateVideo()">
        <span>🎬</span> Generate Video with Google Veo
    </button>

    <div id="status"></div>

    <div id="video-wrapper" class="video-box">
        <video id="video" controls playsinline></video>
    </div>

    <a id="download" class="download-btn" download="ai-video.mp4">
        ⬇️ Download Generated Video (.mp4)
    </a>

</div>

<script>
function setPreset(text) {
    document.getElementById("prompt").value = text;
}

function previewImage(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById("preview-img").src = e.target.result;
        document.getElementById("preview-container").style.display = "block";
        document.getElementById("upload-label").style.display = "none";
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById("image").value = "";
    document.getElementById("preview-container").style.display = "none";
    document.getElementById("upload-label").style.display = "block";
}

async function generateVideo() {
    const prompt = document.getElementById("prompt").value.trim();
    const imageInput = document.getElementById("image");
    const image = imageInput.files[0];
    const apiKey = document.getElementById("api_key").value.trim();
    const status = document.getElementById("status");
    const btn = document.getElementById("btn-submit");
    const video = document.getElementById("video");
    const videoWrapper = document.getElementById("video-wrapper");
    const download = document.getElementById("download");

    if (!prompt) {
        status.innerHTML = "⚠️ Please enter a prompt first.";
        return;
    }

    btn.disabled = true;
    status.innerHTML = '<span class="spinner"></span> Contacting Google Veo 3.1 video engine... Please wait (typically 30-90s)';
    videoWrapper.style.display = "none";
    download.style.display = "none";

    const formData = new FormData();
    formData.append("prompt", prompt);
    if (image) {
        formData.append("image", image);
    }
    if (apiKey) {
        formData.append("api_key", apiKey);
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        status.innerHTML = '<span class="spinner"></span> Generating video via Google Veo 3.1... (' + elapsed + 's elapsed)';
    }, 1000);

    try {
        const response = await fetch("/generate", {
            method: "POST",
            body: formData
        });

        clearInterval(timerInterval);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Generation failed with code " + response.status);
        }

        if (!data.video_url) {
            throw new Error("No video URL returned from the server.");
        }

        video.src = data.video_url;
        videoWrapper.style.display = "block";
        video.load();

        download.href = data.video_url;
        download.style.display = "block";

        status.innerHTML = "✅ Video successfully generated with Google Veo!";
    } catch (error) {
        clearInterval(timerInterval);
        status.innerHTML = "❌ " + error.message;
    } finally {
        btn.disabled = false;
    }
}
</script>

</body>
</html>
"""


@app.route("/")
def home():
    return render_template_string(HTML)


@app.route("/videos/<filename>")
def serve_video(filename):
    return send_from_directory(VIDEOS_DIR, filename, mimetype="video/mp4")


@app.route("/generate", methods=["POST"])
def generate():
    """
    AI Video Generator endpoint.
    Accepts:
      - prompt (required text)
      - image (optional starting frame file)
      - api_key (optional API key passed from form)
    Uses Google GenAI SDK (Veo 3.1) to generate video, polls operation, and returns video_url.
    """
    api_key = get_api_key(request)

    prompt = request.form.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt is required."}), 400

    image_file = request.files.get("image")

    try:
        from google import genai
        from google.genai import types

        if not api_key:
            return jsonify({
                "error": "GEMINI_API_KEY is missing. Please provide it in the form or set GEMINI_API_KEY in your .env file."
            }), 400

        print("🎬 Initializing Google GenAI Client with model veo-3.1-generate-preview...")
        client = genai.Client(api_key=api_key)

        image_param = None
        if image_file:
            image_bytes = image_file.read()
            mime_type = image_file.mimetype or "image/png"
            try:
                image_param = types.Image.from_bytes(data=image_bytes, mime_type=mime_type)
            except Exception:
                image_param = {
                    "image_bytes": image_bytes,
                    "mime_type": mime_type
                }

        config = types.GenerateVideosConfig(
            number_of_videos=1,
            resolution="720p",
            aspect_ratio="16:9"
        )

        print(f"🚀 Triggering client.models.generate_videos for prompt: {prompt[:60]}...")

        if image_param is not None:
            operation = client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt,
                image=image_param,
                config=config
            )
        else:
            operation = client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt,
                config=config
            )

        print(f"⏳ Operation created: {operation.name}. Polling status...")

        poll_count = 0
        max_polls = 60
        while not operation.done and poll_count < max_polls:
            time.sleep(5)
            operation = client.operations.get(operation)
            poll_count += 1
            print(f"   ... polling Veo operation ({poll_count * 5}s elapsed)")

        if not operation.done:
            return jsonify({
                "error": "Video generation operation timed out on server polling."
            }), 504

        if operation.error:
            print(f"❌ Generation failed: {operation.error}")
            return jsonify({
                "error": f"Veo generation error: {str(operation.error)}"
            }), 500

        result = operation
        generated_videos = result.response.generated_videos if result.response else []
        if not generated_videos:
            return jsonify({
                "error": "The model completed but did not return any generated videos."
            }), 500

        first_video = generated_videos[0]

        filename = f"veo_{uuid.uuid4().hex[:12]}.mp4"
        output_path = VIDEOS_DIR / filename

        print(f"💾 Downloading generated video to {output_path}...")
        client.files.download(
            file=first_video.video,
            path=str(output_path)
        )

        video_url = f"/videos/{filename}"
        print(f"✅ Video successfully saved! Serving at {video_url}")

        return jsonify({
            "success": True,
            "video_url": video_url,
            "filename": filename,
            "prompt": prompt
        })

    except ImportError:
        print("⚠️ google-genai module not installed. Run: pip install google-genai")
        return jsonify({
            "error": "google-genai Python package is not installed. Run: pip install google-genai"
        }), 500
    except Exception as e:
        print(f"❌ Error during video generation: {e}")
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🎬 Boss AI Video Generator running on http://0.0.0.0:{port}")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
`;
