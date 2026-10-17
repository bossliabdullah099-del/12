import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Maximize2,
  Video,
  Copy,
  Check,
  RotateCcw,
  Upload,
  ImagePlus,
  Layers,
  X,
  Wand2,
  Eye,
  Shuffle,
  CheckCircle2,
  Trash2,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  Clock,
  SlidersHorizontal,
  Database,
  Cloud,
  Code,
  Terminal,
  Settings2,
  Sliders,
  Laptop,
  Tablet,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { ImageJob, ImageAspectRatio, ImageStyle } from '../types';
import { 
  saveImageToFirestore, 
  fetchImagesFromFirestore, 
  deleteImageFromFirestore 
} from '../lib/firebase';

const SDXL_PYTHON_CODE = `import torch
from diffusers import StableDiffusionXLPipeline
from diffusers.utils import load_image

def generate_image_from_photo(input_image_path: str, prompt: str, output_image_path: str = "output.png"):
    # 1. Select hardware device (CUDA GPU recommended)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    # 2. Load the base SDXL pipeline
    model_id = "stabilityai/stable-diffusion-xl-base-1.0"
    pipe = StableDiffusionXLPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch_dtype, 
        use_safetensors=True
    )

    # 3. Load IP-Adapter weights (allows using an image as a prompt)
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
    pipe.set_ip_adapter_scale(0.7)

    # 5. Load user's reference photograph
    ip_adapter_image = load_image(input_image_path)

    # 6. Generate the image combining the photo and text prompt
    print("Generating image...")
    image = pipe(
        prompt=prompt,
        ip_adapter_image=ip_adapter_image,
        negative_prompt="blurry, distorted, low quality, extra limbs",
        num_inference_steps=30,
        guidance_scale=7.5,
    ).images[0]

    # 7. Save output
    image.save(output_image_path)
    print(f"Image successfully saved to {output_image_path}")

# Example Usage:
if __name__ == "__main__":
    # Replace 'my_photo.jpg' with the path to your image
    input_photo = "my_photo.jpg" 
    
    text_prompt = "A high-resolution professional portrait of a person as an astronaut on Mars, cinematic lighting, photorealistic, 8k"
    
    generate_image_from_photo(
        input_image_path=input_photo,
        prompt=text_prompt,
        output_image_path="astronaut_portrait.png"
    )`;

const OPENAI_IMAGE_EDIT_PYTHON_CODE = `import base64
import io
import os
from openai import OpenAI
from PIL import Image
import requests

client = OpenAI()

def prepare_image(image_path_or_url: str) -> io.BytesIO:
    """Loads an image from a local file path or web URL, converts it to square PNG,
    and returns it as a BytesIO stream in memory.
    """
    if image_path_or_url.startswith("http://") or image_path_or_url.startswith("https://"):
        response = requests.get(image_path_or_url)
        img = Image.open(io.BytesIO(response.content))
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

def generate_image_from_photo(input_source: str, prompt: str, output_path: str = "generated_image.png"):
    print("Preparing image...")
    image_stream = prepare_image(input_source)

    print("Generating new image via OpenAI API...")
    # Use gpt-image-1 (or dall-e-2) depending on your access
    response = client.images.edit(
        model="gpt-image-1",  # You can also use "dall-e-2"
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

if __name__ == "__main__":
    # Get inputs from user
    photo_input = input("Enter image path or URL: ").strip('"\\\'')
    user_prompt = input("Enter prompt (e.g., 'Turn this person into a cyberpunk warrior in neon city'): ")

    try:
        generate_image_from_photo(photo_input, user_prompt)
    except Exception as e:
        print(f"\\nError: {e}")`;

interface ImageGeneratorViewProps {
  initialPrompt?: string;
  initialReferenceImage?: string | null;
  onSendToVideo: (prompt: string) => void;
  isDarkMode: boolean;
}

export interface AspectRatioOption {
  id: ImageAspectRatio;
  label: string;
  sub: string;
  deviceGroup: 'Desktop & Laptops' | 'Tablets / iPads' | 'Mobile Phones' | 'Universal';
  deviceBadge: string;
  category: 'desktop' | 'tablet' | 'mobile' | 'universal';
  ratioClass: string;
  width: number;
  height: number;
}

// Aspect ratio options mapped to Desktop & Laptops (16:10 / 3:2), Tablets / iPads (4:3 / 16:10), Mobile Phones (19.5:9 / 18:9)
const ASPECT_RATIOS: Array<AspectRatioOption> = [
  // 1. Desktop & Laptops: 16:10 / 3:2
  {
    id: '16:10',
    label: '16:10',
    sub: 'Desktop & Laptops',
    deviceGroup: 'Desktop & Laptops',
    deviceBadge: 'MacBook / PC',
    category: 'desktop',
    ratioClass: 'w-5 h-3.2',
    width: 1280,
    height: 800,
  },
  {
    id: '3:2',
    label: '3:2',
    sub: 'Desktop & Laptops',
    deviceGroup: 'Desktop & Laptops',
    deviceBadge: 'Surface / Laptop',
    category: 'desktop',
    ratioClass: 'w-4.5 h-3',
    width: 1200,
    height: 800,
  },

  // 2. Tablets / iPads: 4:3 or 16:10
  {
    id: '4:3',
    label: '4:3',
    sub: 'Tablets / iPads',
    deviceGroup: 'Tablets / iPads',
    deviceBadge: 'Apple iPad',
    category: 'tablet',
    ratioClass: 'w-4 h-3',
    width: 1152,
    height: 864,
  },

  // 3. Mobile Phones: 19.5:9 or 18:9
  {
    id: '19.5:9',
    label: '19.5:9',
    sub: 'Mobile Phones',
    deviceGroup: 'Mobile Phones',
    deviceBadge: 'iPhone & Galaxy',
    category: 'mobile',
    ratioClass: 'w-2.5 h-5.5',
    width: 720,
    height: 1560,
  },
  {
    id: '18:9',
    label: '18:9',
    sub: 'Mobile Phones',
    deviceGroup: 'Mobile Phones',
    deviceBadge: 'FullView Phone',
    category: 'mobile',
    ratioClass: 'w-2.5 h-5',
    width: 720,
    height: 1440,
  },

  // 4. Universal Standards
  {
    id: '16:9',
    label: '16:9',
    sub: 'Landscape HD',
    deviceGroup: 'Universal',
    deviceBadge: 'Cinema & TV',
    category: 'universal',
    ratioClass: 'w-5 h-2.8',
    width: 1280,
    height: 720,
  },
  {
    id: '1:1',
    label: '1:1',
    sub: 'Square',
    deviceGroup: 'Universal',
    deviceBadge: 'Feed & Avatar',
    category: 'universal',
    ratioClass: 'w-4 h-4',
    width: 1024,
    height: 1024,
  },
  {
    id: '9:16',
    label: '9:16',
    sub: 'Story / Reel',
    deviceGroup: 'Mobile Phones',
    deviceBadge: 'Shorts & Reels',
    category: 'mobile',
    ratioClass: 'w-2.8 h-5',
    width: 720,
    height: 1280,
  },
  {
    id: '4:5',
    label: '4:5',
    sub: 'Social Portrait',
    deviceGroup: 'Universal',
    deviceBadge: 'Social Feed',
    category: 'universal',
    ratioClass: 'w-3.5 h-4.5',
    width: 896,
    height: 1120,
  },
];

// Helper to auto-detect current device screen ratio
const detectDeviceScreenRatio = (): { ratio: ImageAspectRatio; label: string; group: string } => {
  if (typeof window === 'undefined') {
    return { ratio: '16:10', label: '16:10 (Desktop & Laptop)', group: 'Desktop & Laptops' };
  }
  const w = window.innerWidth;
  const ua = navigator.userAgent;
  const isMobile = w < 640 || /iPhone|Android.*Mobile|Mobile/i.test(ua);
  const isTablet = (w >= 640 && w < 1024) || /iPad|Android(?!.*Mobile)/i.test(ua);

  if (isMobile) {
    return { ratio: '19.5:9', label: '19.5:9 (Mobile Phones)', group: 'Mobile Phones' };
  }
  if (isTablet) {
    return { ratio: '4:3', label: '4:3 (Tablets / iPads)', group: 'Tablets / iPads' };
  }
  return { ratio: '16:10', label: '16:10 (Desktop & Laptops)', group: 'Desktop & Laptops' };
};

// Style options with aesthetic descriptors & icons
const STYLE_OPTIONS: Array<{
  id: ImageStyle;
  label: string;
  badge: string;
  description: string;
  gradient: string;
}> = [
  {
    id: 'Realistic',
    label: 'Realistic',
    badge: '8K Photoreal',
    description: 'Hasselblad 85mm lens, natural textures & true-to-life lighting',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'Cinematic',
    label: 'Cinematic',
    badge: '35mm Film',
    description: 'Anamorphic widescreen, volumetric lighting & Hollywood color grade',
    gradient: 'from-amber-600 to-rose-600',
  },
  {
    id: 'Anime',
    label: 'Anime',
    badge: 'Makoto Shinkai',
    description: 'Luminous cel shading, vibrant palettes & crisp line art',
    gradient: 'from-pink-600 to-purple-600',
  },
  {
    id: '3D',
    label: '3D',
    badge: 'Octane Render',
    description: 'Unreal Engine 5 shaders, raytraced subsurface scattering & depth',
    gradient: 'from-emerald-600 to-teal-500',
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    badge: 'Mythic Art',
    description: 'Celestial particles, glowing magical ether & ancient mythical lore',
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    id: 'Cyberpunk',
    label: 'Cyberpunk',
    badge: 'Neon Sci-Fi',
    description: 'Rain-slicked neon streets, cybernetic tech & holographic glow',
    gradient: 'from-cyan-500 to-fuchsia-600',
  },
];

// Starter prompts for quick inspiration
const PROMPT_SUGGESTIONS = [
  'A mystical obsidian cybernetic wolf with glowing neon azure eyes in a foggy bamboo forest, 8k resolution',
  'Futuristic glass greenhouse hanging inside a giant orbital space station with Earth glowing in the background',
  'Hyperrealistic portrait of an ancient sorceress crowned with luminescent crystalline butterflies and starlight',
  'Steampunk locomotive racing through clouds across a suspended brass viaduct during a dramatic sunset',
  'Ethereal Japanese temple nestled atop a floating mountain island covered in glowing cherry blossoms',
  'A cozy underwater library illuminated by bioluminescent jellyfish drifting outside massive curved windows',
];

// Default sample gallery for first-time visitors
const DEFAULT_GALLERY_IMAGES: ImageJob[] = [
  {
    id: 'sample_img_1',
    prompt: 'Cyberpunk neon ronin standing in rain with glowing Katana and holographic billboards',
    revisedPrompt: 'A lone cyberpunk ronin warrior in reflective black tactical armor, standing under neon pink and teal holographic signs in a torrential downpour, holding a glowing katana casting reflections on wet asphalt.',
    style: 'Cyberpunk',
    aspectRatio: '16:9',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1280&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 3600000,
    modelUsed: 'Google Gemini Image Model',
    seed: 7482910,
    dimensions: { width: 1280, height: 720 },
  },
  {
    id: 'sample_img_2',
    prompt: 'Ethereal crystalline dragon perched atop mystical floating mountain shrouded in nebula dust',
    revisedPrompt: 'A magnificent dragon sculpted from translucent crystal and glowing amethysts, resting its claws atop a jagged floating peak surrounded by cosmic nebulas and drifting gold stardust.',
    style: 'Fantasy',
    aspectRatio: '1:1',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 7200000,
    modelUsed: 'Google Gemini Image Model',
    seed: 4920183,
    dimensions: { width: 1024, height: 1024 },
  },
  {
    id: 'sample_img_3',
    prompt: 'Hyperrealistic studio portrait with subtle cybernetic gold filigree and glowing eye lens',
    revisedPrompt: 'Cinematic studio close-up portrait of a woman with delicate gold micro-circuits traced across her cheekbones, soft rim lighting, shallow depth of field, 85mm portraiture.',
    style: 'Realistic',
    aspectRatio: '4:5',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=896&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 14400000,
    modelUsed: 'Google Gemini Image Model',
    seed: 8192034,
    dimensions: { width: 896, height: 1120 },
  },
];

export const ImageGeneratorView: React.FC<ImageGeneratorViewProps> = ({
  initialPrompt = '',
  initialReferenceImage = null,
  onSendToVideo,
  isDarkMode,
}) => {
  // Main form state
  const [prompt, setPrompt] = useState(
    initialPrompt || 'A majestic mechanical lion with luminous cyan circuit patterns standing on a cliff at dawn, 8k resolution'
  );
  const [style, setStyle] = useState<ImageStyle>('Realistic');
  const [detectedDevice] = useState(() => detectDeviceScreenRatio());
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(() => detectDeviceScreenRatio().ratio);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'tablet' | 'mobile'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Reference image from gallery/upload (remix)
  const [referenceImage, setReferenceImage] = useState<string | null>(initialReferenceImage);
  const [referenceImageName, setReferenceImageName] = useState<string>(
    initialReferenceImage ? 'Reference Photo Attached' : ''
  );
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Gallery and Active Image state (persisted to localStorage)
  const [gallery, setGallery] = useState<ImageJob[]>(() => {
    const saved = localStorage.getItem('boss_ai_image_gallery');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_GALLERY_IMAGES;
  });

  const [selectedImage, setSelectedImage] = useState<ImageJob | null>(() => {
    return gallery[0] || null;
  });

  const [lightboxImage, setLightboxImage] = useState<ImageJob | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedRevised, setCopiedRevised] = useState(false);
  const [showRevisedPrompt, setShowRevisedPrompt] = useState(true);
  const [filterStyle, setFilterStyle] = useState<string>('all');
  const [isDbConnected, setIsDbConnected] = useState(true);

  // SDXL Base 1.0 + IP-Adapter controls
  const [ipAdapterScale, setIpAdapterScale] = useState<number>(0.7);
  const [negativePrompt, setNegativePrompt] = useState<string>(
    'blurry, distorted, low quality, extra limbs'
  );
  const [guidanceScale, setGuidanceScale] = useState<number>(7.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState<number>(30);
  const [showAdvancedSdxl, setShowAdvancedSdxl] = useState<boolean>(false);
  const [showPythonCodeModal, setShowPythonCodeModal] = useState<boolean>(false);
  const [copiedPythonCode, setCopiedPythonCode] = useState<boolean>(false);
  const [engine, setEngine] = useState<'openai-edit' | 'sdxl-ip-adapter' | 'auto'>('openai-edit');
  const [codeModalTab, setCodeModalTab] = useState<'openai' | 'sdxl'>('openai');

  // Sync images from Firestore Database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCloudGallery() {
      try {
        const cloudImages = await fetchImagesFromFirestore();
        if (isMounted && cloudImages && cloudImages.length > 0) {
          setGallery((prev) => {
            const combined = [...cloudImages];
            const existingIds = new Set(cloudImages.map((img) => img.id));
            for (const item of prev) {
              if (!existingIds.has(item.id)) {
                combined.push(item);
              }
            }
            return combined;
          });
          setIsDbConnected(true);
        }
      } catch (e) {
        console.warn('Firestore gallery fetch notice:', e);
      }
    }
    loadCloudGallery();
    return () => { isMounted = false; };
  }, []);

  // Sync external preloads
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      promptInputRef.current?.focus();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialReferenceImage) {
      setReferenceImage(initialReferenceImage);
      setReferenceImageName('Attached Photo from Gallery');
    }
  }, [initialReferenceImage]);

  // Persist gallery to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('boss_ai_image_gallery', JSON.stringify(gallery));
    } catch (e) {
      console.warn('Failed to save gallery to localStorage:', e);
    }
  }, [gallery]);

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setReferenceImage(dataUrl);
        setReferenceImageName(file.name || 'Uploaded Photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Enhance prompt with Google AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (e) {
      console.warn('Enhance prompt failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Surprise Me / Random Prompt
  const handleSurpriseMe = () => {
    const random = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPrompt(random);
    const styles: ImageStyle[] = ['Realistic', 'Cinematic', 'Anime', '3D', 'Fantasy', 'Cyberpunk'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setStyle(randomStyle);
  };

  // Main Image Generation Execution
  const handleGenerateImage = async (customPrompt?: string, customSeed?: number) => {
    const promptToUse = (customPrompt || prompt).trim();
    if (!promptToUse || isGenerating) return;

    setIsGenerating(true);
    setLoadingProgress(10);
    setGenerationStep(
      engine === 'openai-edit'
        ? (referenceImage ? 'Preparing 1:1 RGBA square photo canvas...' : 'Synthesizing with OpenAI Images API...')
        : (referenceImage ? 'Loading SDXL Base 1.0 & IP-Adapter (h94/IP-Adapter)...' : 'Loading Stable Diffusion XL Base 1.0 Pipeline...')
    );

    // Progress animations
    const t1 = setTimeout(() => {
      setLoadingProgress(35);
      setGenerationStep(
        engine === 'openai-edit'
          ? (referenceImage ? 'Calling OpenAI client.images.edit (model: gpt-image-1)...' : 'Calling OpenAI DALL-E 3 direct generation...')
          : (referenceImage ? `Conditioning IP-Adapter photo features (scale: ${ipAdapterScale})...` : `Directing ${style} visual aesthetic & lighting...`)
      );
    }, 800);

    const t2 = setTimeout(() => {
      setLoadingProgress(65);
      setGenerationStep(
        engine === 'openai-edit'
          ? 'Decoding 1024x1024 b64_json image stream...'
          : `Running ${numInferenceSteps} diffusion steps (CFG: ${guidanceScale})...`
      );
    }, 1800);

    const t3 = setTimeout(() => {
      setLoadingProgress(90);
      setGenerationStep(
        engine === 'openai-edit'
          ? 'Finalizing photorealistic output render...'
          : 'Mastering 4K photorealistic render with SDXL...'
      );
    }, 3000);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          style,
          aspectRatio,
          seed: customSeed,
          referenceImage: referenceImage || undefined,
          engine,
          ipAdapterScale,
          negativePrompt,
          guidanceScale,
          numInferenceSteps,
        }),
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      if (!data.imageUrl) {
        throw new Error('Image generator returned no image URL');
      }

      // Preload image in browser memory before showing
      await new Promise((resolve) => {
        const img = new Image();
        img.src = data.imageUrl;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });

      setLoadingProgress(100);

      const newJob: ImageJob = {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        prompt: data.prompt || promptToUse,
        revisedPrompt: data.revisedPrompt,
        style: data.style || style,
        aspectRatio: data.aspectRatio || aspectRatio,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt || Date.now(),
        seed: data.seed,
        modelUsed: data.modelUsed,
        dimensions: data.dimensions,
        sourceImage: referenceImage || undefined,
        isRemix: Boolean(referenceImage),
        ipAdapterScale: referenceImage ? ipAdapterScale : undefined,
        negativePrompt: data.negativePrompt || negativePrompt,
        guidanceScale: data.guidanceScale || guidanceScale,
        numInferenceSteps: data.numInferenceSteps || numInferenceSteps,
        engine: data.engine || engine,
      };

      setSelectedImage(newJob);
      setGallery((prev) => [newJob, ...prev.filter((i) => i.id !== newJob.id)]);
      setShowRevisedPrompt(true);

      // Persist directly to Google Firestore Database
      saveImageToFirestore(newJob).catch((e) => {
        console.warn('Background Firestore image save notice:', e);
      });

      // Scroll smoothly to generated image showcase
      const showcaseElem = document.getElementById('generated-image-showcase');
      if (showcaseElem) {
        showcaseElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      alert(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      setLoadingProgress(0);
    }
  };

  // Regenerate with a fresh seed
  const handleRegenerate = () => {
    const newSeed = Math.floor(Math.random() * 8999999) + 1000000;
    handleGenerateImage(selectedImage?.prompt || prompt, newSeed);
  };

  // Download image file cleanly
  const handleDownload = async (imageUrl: string, promptText: string) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanSlug = promptText
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 32);
      link.download = `ai-image-${cleanSlug || 'render'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Direct link fallback
      const link = document.createElement('a');
      link.href = imageUrl;
      link.target = '_blank';
      link.download = 'ai-image.png';
      link.click();
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: 'prompt' | 'revised') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedRevised(true);
      setTimeout(() => setCopiedRevised(false), 2000);
    }
  };

  // Delete from gallery
  const handleDeleteFromGallery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteImageFromFirestore(id).catch((err) => {
      console.warn('Firestore delete notice:', err);
    });
    setGallery((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (selectedImage?.id === id) {
        setSelectedImage(filtered[0] || null);
      }
      return filtered;
    });
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Clear all generated image history?')) {
      setGallery([]);
      setSelectedImage(null);
      localStorage.removeItem('boss_ai_image_gallery');
    }
  };

  // Filtered gallery items
  const filteredGallery = filterStyle === 'all'
    ? gallery
    : gallery.filter((item) => item.style.toLowerCase() === filterStyle.toLowerCase());

  return (
    <div className="flex-1 overflow-y-auto min-h-screen p-4 sm:p-6 lg:p-8 bg-[#0a0a0d] text-white">
      {/* Hidden File Input for Gallery Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          if (e.target) e.target.value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Top Futuristic Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                  AI Image Generator
                </h1>
                <p className="text-xs text-cyan-400/90 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>OpenAI gpt-image-1 & SDXL Base 1.0 + IP-Adapter Active</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm font-mono">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>OpenAI gpt-image-1</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>SDXL 1.0 + IP-Adapter</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setCodeModalTab('openai');
                setShowPythonCodeModal(true);
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
              title="View Python scripts for OpenAI & SDXL Pipelines"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Python Pipelines</span>
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firestore Active</span>
            </span>
          </div>
        </div>

        {/* SECTION 1: PROMPT INPUT & CONTROLS STUDIO */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          className={`rounded-3xl border transition-all duration-300 p-5 sm:p-6 shadow-2xl relative overflow-hidden ${
            isDraggingFile
              ? 'border-cyan-400 ring-4 ring-cyan-500/30 bg-[#141824]'
              : 'border-white/10 bg-[#12131a]/90 backdrop-blur-xl'
          }`}
        >
          {/* Subtle glowing corner gradient */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {/* AI Image Synthesis Engine Selector */}
          <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Synthesis Pipeline:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 rounded-xl border border-white/10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEngine('openai-edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  engine === 'openai-edit'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>OpenAI gpt-image-1</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 font-mono">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setEngine('sdxl-ip-adapter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  engine === 'sdxl-ip-adapter'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>SDXL 1.0</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 font-mono">IP-Adapter</span>
              </button>
              <button
                type="button"
                onClick={() => setEngine('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  engine === 'auto'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Auto-Engine</span>
              </button>
            </div>
          </div>

          {/* Reference Photograph Banner */}
          {referenceImage && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#10192d] to-indigo-950/50 border border-cyan-500/40 shadow-xl animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={referenceImage}
                      alt="Input Photograph"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-400 shadow-md shadow-cyan-500/20"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-black/90 px-1 py-0.5 rounded text-[8px] font-mono text-cyan-300 border border-cyan-400/40">
                      Photo
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <ImagePlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Input Photograph · {engine === 'openai-edit' ? 'OpenAI client.images.edit Active' : 'SDXL + IP-Adapter Active'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {engine === 'openai-edit' ? '1:1 RGBA Square Buffer' : 'h94/IP-Adapter'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 truncate max-w-xs sm:max-w-md mt-0.5">
                      {referenceImageName} · {engine === 'openai-edit' ? 'Converts to 1:1 RGBA square & edits with OpenAI API' : 'Fuses facial & structural traits with text prompt'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt('Turn this person into a cyberpunk warrior in neon city');
                      setStyle('Cyberpunk');
                      setEngine('openai-edit');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-1 shadow-sm"
                    title="Load example prompt from the OpenAI images.edit script"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>Preset: Cyberpunk Warrior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt('A high-resolution professional portrait of a person as an astronaut on Mars, cinematic lighting, photorealistic, 8k');
                      setStyle('Realistic');
                      setEngine('sdxl-ip-adapter');
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1 shadow-sm"
                    title="Load example prompt from the SDXL IP-Adapter script"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    <span>Preset: Astronaut on Mars</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceImage(null);
                      setReferenceImageName('');
                    }}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Remove photograph"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* IP-Adapter Scale Slider */}
              <div className="mt-3 pt-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>IP-Adapter Scale:</span>
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 font-bold">
                      {ipAdapterScale}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {ipAdapterScale >= 0.8
                      ? 'High Photo Retention (Identity Locked)'
                      : ipAdapterScale >= 0.5
                      ? 'Balanced Fusion (Default Recommended)'
                      : 'Creative / Prompt Dominant'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={ipAdapterScale}
                  onChange={(e) => setIpAdapterScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0.1 (Prompt Heavy)</span>
                  <span className="text-cyan-400 font-bold">0.7 (Default Balance)</span>
                  <span>1.0 (Maximum Photo Features)</span>
                </div>
                <p className="text-[11px] text-gray-400 italic mt-1.5">
                  Higher values retain more features from the input photo; lower values give more weight to the prompt.
                </p>
              </div>
            </div>
          )}

          {/* Large Prompt Text Box */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                <span>Describe your image prompt</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                  title="Generate a random creative prompt"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Surprise Me</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                  title="Enhance prompt with Google AI photographic director"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                  <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
                {prompt.trim() && (
                  <button
                    type="button"
                    onClick={() => setPrompt('')}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Clear prompt"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              ref={promptInputRef}
              id="image-generator-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerateImage();
                }
              }}
              rows={4}
              placeholder="What do you want to create? (e.g. 'A futuristic cyberpunk samurai under neon rain in 4K', 'An ethereal fantasy celestial castle in the clouds')..."
              className="w-full px-4 py-3.5 rounded-2xl bg-[#090a0f]/90 border border-white/15 text-white placeholder:text-gray-500 text-sm sm:text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-sans"
            />

            {/* Prompt Counter & Gallery Attachment Trigger */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                title="Add an image from your photo gallery as a reference to remix"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Attach photo from gallery</span>
              </button>
              <div className="flex items-center gap-2 font-mono">
                <span>{prompt.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>·</span>
                <span>{prompt.length} chars</span>
              </div>
            </div>
          </div>

          {/* Prompt Suggestions Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <span className="text-[11px] text-gray-500 whitespace-nowrap font-medium">Ideas:</span>
            {PROMPT_SUGGESTIONS.slice(0, 4).map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(s)}
                className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white whitespace-nowrap truncate max-w-[220px] transition-colors"
                title={s}
              >
                {s}
              </button>
            ))}
          </div>

          {/* CONTROLS: STYLE & ASPECT RATIO OPTIONS */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Style Selector (Realistic, Cinematic, Anime, 3D, Fantasy, Cyberpunk) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Artistic Style</span>
                </label>
                <span className="text-[11px] font-mono text-cyan-400 font-medium">
                  {style}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((item) => {
                  const isSelected = style === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyle(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-md shadow-cyan-500/10'
                          : 'border-white/10 bg-[#090a0f]/60 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-gray-200'}`}>
                          {item.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-0.5 truncate">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selector with Device Categorization (Desktop 16:10/3:2, Tablet 4:3/16:10, Mobile 19.5:9/18:9) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Aspect Ratio & Device Optimization</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <span>🎯 Active:</span>
                    <strong className="text-white">{detectedDevice.group}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-mono text-indigo-400 font-medium">
                  {ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.sub} ({ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.width}×{ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.height})
                </span>
              </div>

              {/* Device Category Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'All Standards', icon: Sparkles },
                  { id: 'desktop', label: '💻 Desktop & Laptops (16:10 / 3:2)', icon: Laptop },
                  { id: 'tablet', label: '📱 Tablets / iPads (4:3 / 16:10)', icon: Tablet },
                  { id: 'mobile', label: '📲 Mobile Phones (19.5:9 / 18:9)', icon: Smartphone },
                ].map((tab) => {
                  const isActive = deviceFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDeviceFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ASPECT_RATIOS.filter((item) => deviceFilter === 'all' || item.category === deviceFilter || (deviceFilter === 'tablet' && item.id === '16:10')).map((item) => {
                  const isSelected = aspectRatio === item.id;
                  const isDeviceDefault = item.id === detectedDevice.ratio;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAspectRatio(item.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all group relative text-left ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-950/50 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                          : 'border-white/10 bg-[#090a0f]/60 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Device badge on card */}
                      <div className="w-full flex items-center justify-between gap-1 text-[9px]">
                        <span className="font-semibold text-gray-400 group-hover:text-gray-300 truncate">
                          {item.deviceBadge}
                        </span>
                        {isDeviceDefault && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Auto
                          </span>
                        )}
                      </div>

                      {/* Visual Aspect Ratio Miniature Box */}
                      <div className="h-10 flex items-center justify-center my-1">
                        <div
                          className={`border-2 rounded-sm transition-colors ${item.ratioClass} ${
                            isSelected ? 'border-indigo-400 bg-indigo-400/25' : 'border-gray-500 group-hover:border-gray-300'
                          }`}
                        />
                      </div>

                      {/* Label & Exact Dimensions */}
                      <div className="w-full text-center">
                        <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-300' : 'text-gray-200'}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] text-gray-400 block font-mono">
                          {item.width}×{item.height}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collapsible SDXL Advanced Parameters (Negative Prompt, Steps, CFG) */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAdvancedSdxl(!showAdvancedSdxl)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Advanced SDXL Settings (Negative Prompt, Steps, CFG Scale)</span>
              {showAdvancedSdxl ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvancedSdxl && (
              <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4 animate-in fade-in duration-200">
                {/* Negative Prompt */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Negative Prompt (What to exclude)
                  </label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, distorted, low quality, extra limbs"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guidance Scale */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span className="font-semibold">Guidance Scale (CFG)</span>
                      <span className="font-mono text-cyan-300 font-bold">{guidanceScale}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="15.0"
                      step="0.5"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>1.0 (Loose)</span>
                      <span>7.5 (Default)</span>
                      <span>15.0 (Strict)</span>
                    </div>
                  </div>

                  {/* Inference Steps */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span className="font-semibold">Inference Steps</span>
                      <span className="font-mono text-cyan-300 font-bold">{numInferenceSteps}</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="50"
                      step="1"
                      value={numInferenceSteps}
                      onChange={(e) => setNumInferenceSteps(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>15 (Fast)</span>
                      <span>30 (Standard)</span>
                      <span>50 (Ultra)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN GENERATE ACTION BAR */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                {referenceImage
                  ? engine === 'openai-edit'
                    ? 'Preparing 1:1 RGBA square photo canvas & synthesizing via OpenAI client.images.edit.'
                    : 'Fusing input photograph with prompt via SDXL Base 1.0 & IP-Adapter (Scale ' + ipAdapterScale + ').'
                  : engine === 'openai-edit'
                  ? 'Generates high-resolution masterpiece directly from user prompt with OpenAI.'
                  : 'Generates high-resolution masterpiece directly from user prompt with SDXL Base 1.0.'}
              </span>
            </div>

            <button
              id="generate-image-btn"
              type="button"
              onClick={() => handleGenerateImage()}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                isGenerating
                  ? 'bg-cyan-900/40 text-cyan-200 border border-cyan-500/30 cursor-not-allowed'
                  : !prompt.trim()
                  ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                  : engine === 'openai-edit'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white hover:brightness-110 active:scale-98 shadow-emerald-500/25 border border-emerald-400/30'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:brightness-110 active:scale-98 shadow-cyan-500/25 border border-cyan-400/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>
                    {engine === 'openai-edit'
                      ? referenceImage
                        ? 'Generate with OpenAI Edit'
                        : 'Generate with OpenAI'
                      : referenceImage
                      ? 'Generate with SDXL + IP-Adapter'
                      : 'Generate with SDXL'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white font-mono">
                    {engine === 'openai-edit'
                      ? 'gpt-image-1'
                      : referenceImage
                      ? 'IP-Adapter'
                      : 'SDXL 1.0'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* FUTURISTIC LOADING ANIMATION BAR (ACTIVE DURING GENERATION) */}
          {isGenerating && (
            <div className="mt-6 p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-2">
                <span className="flex items-center gap-2 font-mono">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{generationStep || 'SDXL Synthesis in progress...'}</span>
                </span>
                <span className="font-mono text-cyan-400">{loadingProgress}%</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm shadow-cyan-400"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Pipeline: {referenceImage ? `SDXL 1.0 + IP-Adapter (${ipAdapterScale})` : 'SDXL Base 1.0'}</span>
                <span>CFG: {guidanceScale} · Steps: {numInferenceSteps}</span>
                <span>Ratio: {aspectRatio}</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: GENERATED-IMAGE SHOWCASE DISPLAY (CHATGPT DALL-E 3 EXPERIENCE) */}
        {selectedImage && (
          <div
            id="generated-image-showcase"
            className="rounded-3xl border border-white/10 bg-[#12131a]/95 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6"
          >
            {/* Showcase Header with metadata badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                    <span>Generated Image</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedImage.style}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedImage.modelUsed || (selectedImage.sourceImage ? 'SDXL 1.0 + IP-Adapter' : 'SDXL Base 1.0')}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {selectedImage.aspectRatio} · {selectedImage.dimensions?.width || 1024}×
                    {selectedImage.dimensions?.height || 1024}px · Seed #{selectedImage.seed || '482019'}
                    {selectedImage.ipAdapterScale !== undefined && ` · Scale ${selectedImage.ipAdapterScale}`}
                    {selectedImage.guidanceScale !== undefined && ` · CFG ${selectedImage.guidanceScale}`}
                    {selectedImage.numInferenceSteps !== undefined && ` · ${selectedImage.numInferenceSteps} steps`}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Download, Regenerate, Fullscreen */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="download-generated-image-btn"
                  onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.prompt)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                  title="Download image in full resolution"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  id="regenerate-image-btn"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  title="Regenerate this prompt with a fresh seed"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLightboxImage(selectedImage)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white border border-white/15 transition-all"
                  title="View Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onSendToVideo(selectedImage.prompt)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                  title="Animate this image into a 5-second AI Video"
                >
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Animate in AI Video</span>
                </button>
              </div>
            </div>

            {/* Input Photograph vs SDXL IP-Adapter Result Comparison */}
            {selectedImage.sourceImage && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage.sourceImage}
                    alt="Input reference photo"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400 shrink-0 shadow-md shadow-cyan-500/20"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                      Input Photograph (ip_adapter_image)
                    </span>
                    <p className="text-xs text-gray-300">
                      IP-Adapter Scale: <strong className="text-white">{selectedImage.ipAdapterScale ?? 0.7}</strong> · Retaining facial traits & subject geometry
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-gray-300 font-mono flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Synthesized with SDXL Base 1.0</span>
                </div>
              </div>
            )}

            {/* Main Generated Image Visual Frame */}
            <div className="relative group rounded-2xl overflow-hidden bg-black/60 border border-white/15 flex items-center justify-center max-h-[640px]">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                referrerPolicy="no-referrer"
                onClick={() => setLightboxImage(selectedImage)}
                className="w-full h-auto max-h-[640px] object-contain transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
              />

              {/* Hover overlay button */}
              <div
                onClick={() => setLightboxImage(selectedImage)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/20">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Click to Expand Lightbox</span>
                </span>
              </div>
            </div>

            {/* Original Prompt Bar with Copy */}
            <div className="p-4 rounded-2xl bg-[#090a0f]/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Prompt:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedImage.prompt, 'prompt')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed font-sans">
                "{selectedImage.prompt}"
              </p>
            </div>

            {/* ChatGPT DALL-E 3 Style "Revised Prompt" Collapsible Section */}
            {selectedImage.revisedPrompt && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRevisedPrompt(!showRevisedPrompt)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-cyan-500/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 font-mono">
                      DALL-E 3 / Imagen
                    </span>
                    <span className="text-xs font-bold text-gray-200">
                      Revised Prompt from Google AI
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyan-400">
                    <span className="text-[11px] opacity-75">{showRevisedPrompt ? 'Hide' : 'Show details'}</span>
                    {showRevisedPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showRevisedPrompt && (
                  <div className="px-4 pb-4 pt-1 border-t border-cyan-500/10 space-y-2">
                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      "{selectedImage.revisedPrompt}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400">
                        Generated by Google Gemini Director for maximum photorealism
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedImage.revisedPrompt || '', 'revised')}
                        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        {copiedRevised ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRevised ? 'Copied' : 'Copy Revised'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Prompt Variations & Iterations */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Iterate on this image (ChatGPT style follow-ups):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Add dramatic sunset golden hour lighting and warm lens flare',
                  'Transform into high-detail cyberpunk neon aesthetic with rain reflections',
                  'Make it a macro close-up portrait with ultra-shallow depth of field',
                  'Render in luminous anime fantasy art style with floating petals',
                  'Add an ancient cosmic starry sky with vivid aurora borealis',
                ].map((iterPrompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const newPromptText = `${selectedImage.prompt}, ${iterPrompt}`;
                      setPrompt(newPromptText);
                      handleGenerateImage(newPromptText);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    + {iterPrompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: IMAGE HISTORY & GALLERY */}
        <div className="rounded-3xl border border-white/10 bg-[#12131a]/80 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-display">
                Image History & Gallery
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/10 text-gray-300">
                {gallery.length}
              </span>
            </div>

            {/* Filter by Style Chips & Clear Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#090a0f] p-1 rounded-xl border border-white/10">
                {['all', 'Realistic', 'Cinematic', 'Anime', '3D', 'Fantasy', 'Cyberpunk'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStyle(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterStyle === st
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>

              {gallery.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Gallery Grid */}
          {filteredGallery.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-sm">No images match this filter yet.</p>
              <button
                type="button"
                onClick={() => setFilterStyle('all')}
                className="text-xs text-cyan-400 underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGallery.map((item) => {
                const isCurrent = selectedImage?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedImage(item);
                      const showcaseElem = document.getElementById('generated-image-showcase');
                      if (showcaseElem) {
                        showcaseElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`group rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-[#090a0f] flex flex-col ${
                      isCurrent
                        ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 hover:border-white/25 hover:shadow-lg'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square overflow-hidden bg-black/60">
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-white/10">
                          {item.style}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/70 backdrop-blur-md text-gray-300 border border-white/10">
                          {item.aspectRatio}
                        </span>
                      </div>

                      {/* Quick Hover Action Bar */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(item);
                          }}
                          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                          title="Fullscreen View"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.imageUrl, item.prompt);
                          }}
                          className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFromGallery(item.id, e)}
                          className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500 text-white transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed font-sans">
                        {item.prompt}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrompt(item.prompt);
                            handleGenerateImage(item.prompt);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Use Prompt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-[#12131a] border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0a0b10]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {lightboxImage.style}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {lightboxImage.aspectRatio} · {lightboxImage.dimensions?.width || 1024}×
                  {lightboxImage.dimensions?.height || 1024}px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(lightboxImage.imageUrl, lightboxImage.prompt)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70 min-h-[350px]">
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.prompt}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Modal Footer Prompt Info */}
            <div className="p-4 border-t border-white/10 bg-[#0a0b10] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                <span>Prompt:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(lightboxImage.prompt, 'prompt')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                "{lightboxImage.prompt}"
              </p>
              {lightboxImage.revisedPrompt && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-1">
                    ChatGPT DALL-E Revised Prompt:
                  </span>
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    "{lightboxImage.revisedPrompt}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DUAL PYTHON CODE PIPELINES MODAL (OpenAI Images API + SDXL IP-Adapter) */}
      {showPythonCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#12131a] border border-cyan-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-cyan-500/10 flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>AI Image Python Pipelines</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {codeModalTab === 'openai' ? 'OpenAI Images API' : 'diffusers SDXL'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {codeModalTab === 'openai'
                      ? 'Converts input photo to square RGBA buffer & calls client.images.edit (gpt-image-1 / dall-e-2)'
                      : 'Runs stabilityai/stable-diffusion-xl-base-1.0 with h94/IP-Adapter'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const codeToCopy = codeModalTab === 'openai' ? OPENAI_IMAGE_EDIT_PYTHON_CODE : SDXL_PYTHON_CODE;
                    navigator.clipboard.writeText(codeToCopy);
                    setCopiedPythonCode(true);
                    setTimeout(() => setCopiedPythonCode(false), 2000);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  {copiedPythonCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPythonCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPythonCodeModal(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 bg-black/40 px-4 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setCodeModalTab('openai')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  codeModalTab === 'openai'
                    ? 'border-emerald-400 text-emerald-300 bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenAI gpt-image-1 (images.edit)</span>
              </button>
              <button
                type="button"
                onClick={() => setCodeModalTab('sdxl')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  codeModalTab === 'sdxl'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>SDXL 1.0 + IP-Adapter</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 sm:p-5 bg-[#090a0f] font-mono text-xs text-cyan-200/90 leading-relaxed border-b border-white/5">
              <pre className="overflow-x-auto whitespace-pre selection:bg-cyan-500 selection:text-black">
                {codeModalTab === 'openai' ? OPENAI_IMAGE_EDIT_PYTHON_CODE : SDXL_PYTHON_CODE}
              </pre>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0a0b10] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Saved locally in repository:{' '}
                  <code className="text-cyan-300 font-mono">
                    {codeModalTab === 'openai' ? 'scripts/openai_image_edit.py' : 'scripts/sdxl_ip_adapter.py'}
                  </code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPythonCodeModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
