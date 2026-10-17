# Boss AI - AI Image Generator Website (ChatGPT & Imagen Experience)

A modern, premium, futuristic, dark-themed AI image generator website modeled after ChatGPT's image generation experience and powered by Google's AI technologies.

---

## Key Features

1. **Text-to-Image Generation (ChatGPT DALL-E & Google Imagen Experience)**
   - Enter any natural language text prompt.
   - Click **Generate Image** to receive high-definition AI generated artwork.
   - **Revised Prompt Director**: Uses Google Gemini to expand your initial idea into a cinematic, photorealistic visual directive with lighting, camera framing, and textures—identical to how ChatGPT DALL-E 3 works.

2. **Artistic Styles**
   - **Realistic**: Photorealistic 8K photography, Hasselblad 85mm f/1.4 lens, natural organic textures, and ray-traced lighting.
   - **Cinematic**: 35mm anamorphic widescreen, volumetric lighting, Hollywood color grading, and dramatic atmospheric depth.
   - **Anime**: Makoto Shinkai studio aesthetic, luminous cel shading, vibrant palettes, and crisp line art.
   - **3D**: Octane Render and Unreal Engine 5 styling, raytraced subsurface scattering, and studio lighting.
   - **Fantasy**: Epic high fantasy concept art, glowing magical ether, celestial cosmic particles, and ancient mythical ambiance.
   - **Cyberpunk**: Futuristic neon aesthetic, rain-slicked asphalt reflections, cybernetic augmentations, and high-tech cityscapes.

3. **Aspect Ratio Controls**
   - **1:1 Square** (1024×1024): Avatars, icons, square social posts.
   - **16:9 Landscape** (1280×720): Cinematic banners, wallpapers, widescreen presentations.
   - **9:16 Portrait / Story** (720×1280): Mobile wallpapers, TikTok, Instagram Stories, and YouTube Shorts.
   - **4:5 Feed Portrait** (896×1120): Instagram feed posts and professional portraiture.

4. **ChatGPT-Style Generated Image Showcase**
   - High-definition viewport with responsive aspect ratio framing.
   - **Download Button**: Directly downloads the full-resolution PNG image with a customized filename.
   - **Regenerate Button**: Generates a fresh seed variation with one click.
   - **Revised Prompt Accordion**: View and copy the expanded photographic prompt produced by Google Gemini.
   - **Metadata Badges**: Model name, style, aspect ratio, exact pixel dimensions, and seed number.
   - **Quick Iteration Pills**: One-click follow-up prompt suggestions (e.g., golden hour lighting, macro lens, neon rain).
   - **Lightbox / Fullscreen Modal**: Expand and inspect the image at maximum resolution with pan/zoom.

5. **Image History & Gallery**
   - Persistent image gallery saved in browser `localStorage`.
   - Filter history by style chips (Realistic, Cinematic, Anime, 3D, Fantasy, Cyberpunk).
   - Hover actions to view fullscreen, download, re-use prompt, or delete from history.
   - Batch clear history button.

6. **Photo Attachment & Image-to-Image Remixing**
   - Drag and drop or attach any reference image from your device photo gallery.
   - Blends your reference image with text prompts for AI style transfer and remixes.

7. **Security & API Architecture**
   - **Zero API Key Leakage**: The Google Gemini API key is stored strictly on the server (`process.env.GEMINI_API_KEY`) and is never sent to or exposed in the frontend client.
   - High-availability backend proxy in `server.ts` handles Google GenAI SDK integration with graceful fallbacks.

---

## Setup & Running Instructions

### 1. Environment Variables

Create or update your `.env` file at the project root:

```env
# Required for Google Gemini AI Director & Image Generation
GEMINI_API_KEY="your-gemini-api-key-here"

# Container & Hosting URL (injected automatically in Cloud Run / AI Studio)
APP_URL="http://localhost:3000"
```

> **Note**: In AI Studio, the `GEMINI_API_KEY` is securely injected via the Secrets panel.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application runs on `http://localhost:3000` with the Vite dev middleware integrated into Express.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Backend API Endpoints

- `POST /api/generate-image`: Accepts `{ prompt, style, aspectRatio, seed, referenceImage }` and returns `{ success, imageUrl, prompt, revisedPrompt, style, aspectRatio, dimensions, seed, modelUsed }`.
- `POST /api/enhance-prompt`: Rewrites prompts with photographic cinematic directives.
- `POST /api/remix-image`: Synthesizes user-uploaded reference photos with prompt directives.
- `POST /api/chat`: Universal AI chat and multimodal assistant.
- `POST /api/generate-video-storyboard`: Directs Google Flow 5-second video storyboards.
- `POST /api/generate-song`: Synthesizes songs and musical arrangements.
