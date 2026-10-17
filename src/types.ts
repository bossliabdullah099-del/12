export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  modelAccess: string;
  avatar?: string;
  isSuperAdmin?: boolean;
  isGuest?: boolean;
}

export type ActiveTab = 'chat' | 'coder' | 'sandbox' | 'video' | 'image' | 'song';

export interface CodeExecutionResult {
  output: string;
  error?: string;
  executionTimeMs?: number;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  mediaType?: 'text' | 'video' | 'image' | 'song';
  mediaData?: any;
  attachedImage?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
  userEmail?: string;
  modelUsed?: string;
}

export interface VideoPromptAnalysis {
  subject: string;
  setting: string;
  lighting: string;
  camera: string;
  mood: string;
  style: string;
  action?: string;
  lens?: string;
  cameraTrajectory?: string;
  flowSpeed?: number;
  showFlowVectors?: boolean;
}

export interface VideoScene {
  index: number;
  timeRange: string; // e.g. "0.0s - 2.5s"
  title: string;
  visualDesc: string;
  cameraMotion: string;
  colorMood: string;
  caption: string;
  imageUrl?: string;
}

export interface VideoJob {
  id: string;
  prompt: string;
  title?: string;
  duration: number; // 5 seconds (Google Flow standard)
  aspectRatio: '16:10' | '3:2' | '4:3' | '19.5:9' | '18:9' | '16:9' | '9:16' | '1:1';
  style: string;
  motionSpeed: 'slow' | 'normal' | 'dynamic';
  cameraTrajectory?: string;
  lens?: string;
  lighting?: string;
  flowSpeed?: number; // 1 to 10
  showFlowVectors?: boolean;
  scenes: VideoScene[];
  audioTrackName: string;
  status: 'rendering' | 'ready' | 'error';
  videoUrl?: string;
  blob?: Blob;
  thumbnailUrl?: string;
  referenceImage?: string;
  analysis?: VideoPromptAnalysis;
  keyframes?: {
    startUrl?: string;
    endUrl?: string;
  };
  createdAt: number;
}

export type DeviceAspectRatio =
  | 'auto'
  | '16:10'
  | '3:2'
  | '4:3'
  | '19.5:9'
  | '18:9';

export type DisplayDeviceCategory = 'desktop' | 'tablet' | 'mobile';

export interface DeviceRatioInfo {
  ratio: DeviceAspectRatio;
  label: string;
  category: DisplayDeviceCategory;
  categoryLabel: string;
  sub: string;
  exampleResolution: string;
  isPrimary: boolean;
}

export type ImageAspectRatio =
  | '16:10'
  | '3:2'
  | '4:3'
  | '19.5:9'
  | '18:9'
  | '16:9'
  | '9:16'
  | '1:1'
  | '4:5';
export type ImageStyle = 'Realistic' | 'Cinematic' | 'Anime' | '3D' | 'Fantasy' | 'Cyberpunk';

export interface ImageJob {
  id: string;
  prompt: string;
  revisedPrompt?: string;
  enhancedPrompt?: string;
  style: ImageStyle | string;
  aspectRatio: ImageAspectRatio;
  imageUrl: string;
  createdAt: number;
  sourceImage?: string;
  isRemix?: boolean;
  seed?: number;
  modelUsed?: string;
  dimensions?: { width: number; height: number };
  ipAdapterScale?: number;
  negativePrompt?: string;
  guidanceScale?: number;
  numInferenceSteps?: number;
  engine?: 'openai-edit' | 'sdxl-ip-adapter' | 'auto';
}

export interface SongJob {
  id: string;
  title: string;
  prompt: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  durationSeconds: number;
  lyrics: string;
  audioBlob?: Blob;
  audioUrl?: string;
  createdAt: number;
}

export interface VideoEditorSettings {
  videoUrl: string | null;
  videoTitle: string;
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  playbackSpeed: number;
  filter: 'none' | 'cyberpunk' | 'vintage' | 'bw' | 'warm' | 'sunset' | 'glow' | 'invert';
  textOverlay: string;
  textPosition: 'top' | 'middle' | 'bottom';
  textSize: number;
  textColor: string;
  bgMusicTrack: string | null;
  volume: number;
}
