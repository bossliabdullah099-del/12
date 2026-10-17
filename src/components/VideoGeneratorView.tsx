import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Video,
  Sparkles,
  Play,
  Pause,
  Download,
  RotateCcw,
  Clock,
  Layers,
  Sliders,
  Volume2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Compass,
  Wand2,
  Upload,
  X,
  Code2,
  Copy,
  Check,
  FileVideo,
} from 'lucide-react';
import { VideoJob, VideoScene } from '../types';
import { VideoRenderer } from '../utils/videoRenderer';
import { FLASK_VIDEO_APP_PY } from '../utils/flaskAppCode';

interface VideoGeneratorViewProps {
  initialPrompt?: string;
  onSendToImage?: (prompt: string) => void;
  isDarkMode: boolean;
}

export const VideoGeneratorView: React.FC<VideoGeneratorViewProps> = ({
  initialPrompt = '',
  onSendToImage,
  isDarkMode,
}) => {
  const [prompt, setPrompt] = useState(
    initialPrompt || 'Futuristic cyberpunk metropolis with flying vehicles, neon skyscrapers, rain reflections, volumetric lighting'
  );
  const [style, setStyle] = useState('Cinematic 3D');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [cameraTrajectory, setCameraTrajectory] = useState('35mm Anamorphic Dolly In');
  const [showFlowVectors, setShowFlowVectors] = useState(false);
  const [flowSpeed, setFlowSpeed] = useState(5);
  const [motionSpeed, setMotionSpeed] = useState<'slow' | 'normal' | 'dynamic'>('dynamic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderSecond, setRenderSecond] = useState(0);
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);

  // Engine mode: 'veo' (Google Veo 3.1 AI Generation) or 'flow' (Instant 60fps Multi-Scene Engine)
  const [engineMode, setEngineMode] = useState<'veo' | 'flow'>('veo');
  const [veoStatusText, setVeoStatusText] = useState<string>('');

  // Prompt + Image -> Video states
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState<string>('');
  const [showPythonModal, setShowPythonModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video playback states & robust multi-engine fallback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [useCanvasPlayer, setUseCanvasPlayer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const rendererInstanceRef = useRef<VideoRenderer | null>(null);
  const canvasAnimFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playStartOffsetRef = useRef<number>(0);

  // Sync initial prompt if passed
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const presetPrompts = [
    { label: '🦁 Lion Dancing', text: 'A majestic golden lion standing upright on two hind legs dancing happily to the beat, waving paws with energetic groove on a savanna stage under sunset lighting' },
    { label: '🐱 Cat DJ', text: 'A cool fluffy cat wearing studio headphones and DJing on glowing vinyl turntables in a neon nightclub' },
    { label: '🐶 Skateboarding Dog', text: 'A golden retriever dog wearing sunglasses skateboarding down a sunny California beach boardwalk with motion blur' },
    { label: '🤖 Robot Breakdancer', text: 'A futuristic chrome robot breakdancing on a wet neon cyberpunk street with reflections' },
    { label: '🏎️ Tokyo Drift', text: 'Hypercar accelerating down Tokyo midnight expressway with motion blur and glowing neon reflections' },
    { label: '🐉 Dragon Soaring', text: 'Colossal mythical dragon with iridescent scales unfurling massive wings and soaring over misty mountain peaks' },
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setReferenceImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    setReferenceFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyPythonCode = () => {
    navigator.clipboard.writeText(FLASK_VIDEO_APP_PY);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Directorial Prompt Enhancer using Google Flow tokenization
  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/enhance-flow-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          cameraMotion: cameraTrajectory,
          style,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (e) {
      console.warn('Enhance prompt failed:', e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Handle generation of AI video (Google Veo 3.1 or Google Flow Engine)
  const handleGenerateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setRenderProgress(10);
    setRenderSecond(0);
    setVideoError(false);

    // MODE 1: Google Veo 3.1 Video Model
    if (engineMode === 'veo') {
      setVeoStatusText('Connecting to Google Veo 3.1 engine...');
      try {
        const startRes = await fetch('/api/generate-veo-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            image: referenceImage,
            aspectRatio,
            resolution: '720p',
            model: 'veo-3.1-generate-preview',
          }),
        });

        const startData = await startRes.json();
        if (!startRes.ok || !startData.operationName) {
          throw new Error(startData.error || 'Failed to start Veo operation');
        }

        const operationName = startData.operationName;
        setVeoStatusText('Veo operation running... synthesizing neural frames');
        setRenderProgress(20);

        let isDone = false;
        let pollAttempts = 0;
        const maxPolls = 60;

        while (!isDone && pollAttempts < maxPolls) {
          await new Promise((r) => setTimeout(r, 4000));
          pollAttempts++;
          const elapsedSec = pollAttempts * 4;
          setRenderSecond(elapsedSec);
          setRenderProgress(Math.min(20 + Math.round((pollAttempts / 30) * 70), 92));
          setVeoStatusText(`Rendering video via Google Veo 3.1... (${elapsedSec}s elapsed)`);

          const statusRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.error) {
              throw new Error(statusData.error);
            }
            if (statusData.done) {
              isDone = true;
              break;
            }
          }
        }

        if (!isDone) {
          throw new Error('Veo generation timed out on server polling.');
        }

        setVeoStatusText('Downloading generated video stream...');
        setRenderProgress(95);

        const downloadRes = await fetch('/api/video-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        if (!downloadRes.ok) {
          throw new Error('Failed to download completed video stream');
        }

        const videoBlob = await downloadRes.blob();
        const videoUrl = URL.createObjectURL(videoBlob);

        const job: VideoJob = {
          id: `veo_${Date.now()}`,
          prompt,
          title: prompt.slice(0, 36),
          duration: 8,
          aspectRatio,
          style,
          cameraTrajectory,
          showFlowVectors: false,
          flowSpeed,
          motionSpeed,
          scenes: [
            {
              index: 1,
              timeRange: '0.0s - 8.0s',
              title: 'Veo 3.1 Cinematic Sequence',
              visualDesc: prompt,
              cameraMotion: cameraTrajectory,
              colorMood: '#6366f1',
              caption: 'Google Veo AI Video',
            },
          ],
          audioTrackName: 'Cinematic Score',
          status: 'ready',
          videoUrl,
          blob: videoBlob,
          referenceImage: referenceImage || undefined,
          createdAt: Date.now(),
        };

        setCurrentJob(job);
        setIsGenerating(false);
        setRenderProgress(100);
        setCurrentTime(0);
        setVeoStatusText('');
        setUseCanvasPlayer(false);
        return;
      } catch (veoErr: any) {
        console.warn('Veo 3.1 engine note:', veoErr?.message || veoErr);
        // If Veo generation fails (e.g. key/quota), smoothly fallback to Flow Studio engine
        setVeoStatusText('Veo notice: switching to high-fidelity Flow Canvas Studio engine...');
      }
    }

    // MODE 2: Google Flow Studio (Instant 60fps Canvas & Audio Engine)
    try {
      // 1. Fetch AI Storyboard from server (Google Flow tokens + 5s keyframes)
      const res = await fetch('/api/generate-video-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          cameraMotion: cameraTrajectory,
          image: referenceImage,
        }),
      });

      const data = await res.json();
      const storyboard = data.storyboard || {};
      const scenes: VideoScene[] = storyboard.scenes || [
        { index: 1, timeRange: '0.0s - 2.5s', title: 'Flow Genesis & Vector Push', visualDesc: prompt, cameraMotion: cameraTrajectory, colorMood: '#00f0ff', caption: 'Phase 1' },
        { index: 2, timeRange: '2.5s - 5.0s', title: 'Flow Apex & Hero Lock', visualDesc: 'Speed ramp', cameraMotion: 'Dynamic 360 Orbit', colorMood: '#ff007f', caption: 'Phase 2' },
      ];

      // 2. Determine canvas dimensions
      let width = 1280;
      let height = 720;
      if (aspectRatio === '9:16') {
        width = 720;
        height = 1280;
      } else if (aspectRatio === '1:1') {
        width = 800;
        height = 800;
      }

      // 3. Render 5-second video with Canvas & MediaRecorder
      const renderer = new VideoRenderer(width, height);
      rendererInstanceRef.current = renderer;
      setVideoError(false);

      let videoBlob: Blob | null = null;
      let videoUrl = '';

      try {
        videoBlob = await renderer.generateVideoBlob({
          prompt,
          style,
          aspectRatio,
          scenes,
          cameraTrajectory,
          showFlowVectors,
          flowSpeed,
          analysis: storyboard.analysis,
          onProgress: (pct, sec) => {
            setRenderProgress(Math.round(pct));
            setRenderSecond(Math.round(sec * 10) / 10);
          },
        });

        if (videoBlob && videoBlob.size > 0) {
          videoUrl = URL.createObjectURL(videoBlob);
        } else {
          setUseCanvasPlayer(true);
        }
      } catch (blobErr) {
        console.warn('Video blob generation failed, using interactive Canvas player fallback:', blobErr);
        setUseCanvasPlayer(true);
      }

      const job: VideoJob = {
        id: `vid_${Date.now()}`,
        prompt,
        title: storyboard.title || prompt.slice(0, 32),
        analysis: storyboard.analysis,
        duration: 5,
        aspectRatio,
        style,
        cameraTrajectory,
        showFlowVectors,
        flowSpeed,
        motionSpeed,
        scenes,
        audioTrackName: storyboard.audioMood || 'Synthesized Cyber Hybrid Score',
        status: 'ready',
        videoUrl: videoUrl || undefined,
        blob: videoBlob || undefined,
        referenceImage: referenceImage || undefined,
        createdAt: Date.now(),
      };

      setCurrentJob(job);
      setIsGenerating(false);
      setRenderProgress(100);
      setCurrentTime(0);
      setVeoStatusText('');
    } catch (err: any) {
      console.error('Video rendering failed:', err);
      setIsGenerating(false);
      setVeoStatusText('');
      alert('Failed to generate video. Please try again.');
    }
  };

  const togglePlay = () => {
    if (useCanvasPlayer || videoError) {
      if (isPlaying) {
        setIsPlaying(false);
        if (canvasAnimFrameRef.current) {
          cancelAnimationFrame(canvasAnimFrameRef.current);
          canvasAnimFrameRef.current = null;
        }
      } else {
        setIsPlaying(true);
        playStartTimeRef.current = performance.now();
        playStartOffsetRef.current = currentTime >= 5 ? 0 : currentTime;
      }
      return;
    }

    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('HTML5 video play failed, falling back to canvas player:', err);
        setVideoError(true);
        setUseCanvasPlayer(true);
        setIsPlaying(true);
        playStartTimeRef.current = performance.now();
        playStartOffsetRef.current = currentTime >= 5 ? 0 : currentTime;
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !useCanvasPlayer && !videoError) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);

    if (useCanvasPlayer || videoError) {
      playStartTimeRef.current = performance.now();
      playStartOffsetRef.current = val;
      if (canvasPreviewRef.current && rendererInstanceRef.current && currentJob) {
        rendererInstanceRef.current.renderToCanvas(canvasPreviewRef.current, val, {
          prompt: currentJob.prompt,
          style: currentJob.style,
          aspectRatio: currentJob.aspectRatio,
          scenes: currentJob.scenes,
          cameraTrajectory: currentJob.cameraTrajectory,
          showFlowVectors: currentJob.showFlowVectors,
          flowSpeed: currentJob.flowSpeed,
          analysis: currentJob.analysis,
        });
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  // Canvas Player real-time animation loop
  useEffect(() => {
    if (!isPlaying || (!useCanvasPlayer && !videoError) || !currentJob) return;

    let animId: number;
    const duration = 5.0;

    const loop = () => {
      const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
      let nextTime = playStartOffsetRef.current + elapsed;
      if (nextTime >= duration) {
        playStartTimeRef.current = performance.now();
        playStartOffsetRef.current = 0;
        nextTime = 0;
      }

      setCurrentTime(nextTime);

      if (canvasPreviewRef.current && rendererInstanceRef.current) {
        rendererInstanceRef.current.renderToCanvas(canvasPreviewRef.current, nextTime, {
          prompt: currentJob.prompt,
          style: currentJob.style,
          aspectRatio: currentJob.aspectRatio,
          scenes: currentJob.scenes,
          cameraTrajectory: currentJob.cameraTrajectory,
          showFlowVectors: currentJob.showFlowVectors,
          flowSpeed: currentJob.flowSpeed,
          analysis: currentJob.analysis,
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    canvasAnimFrameRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
      canvasAnimFrameRef.current = null;
    };
  }, [isPlaying, useCanvasPlayer, videoError, currentJob]);

  // Initial draw on canvas when canvas player is active
  useEffect(() => {
    if (currentJob && (useCanvasPlayer || videoError) && canvasPreviewRef.current) {
      if (!rendererInstanceRef.current) {
        let width = 1280;
        let height = 720;
        if (currentJob.aspectRatio === '9:16') {
          width = 720;
          height = 1280;
        } else if (currentJob.aspectRatio === '1:1') {
          width = 800;
          height = 800;
        }
        rendererInstanceRef.current = new VideoRenderer(width, height);
      }
      rendererInstanceRef.current.renderToCanvas(canvasPreviewRef.current, currentTime, {
        prompt: currentJob.prompt,
        style: currentJob.style,
        aspectRatio: currentJob.aspectRatio,
        scenes: currentJob.scenes,
        cameraTrajectory: currentJob.cameraTrajectory,
        showFlowVectors: currentJob.showFlowVectors,
        flowSpeed: currentJob.flowSpeed,
        analysis: currentJob.analysis,
      });
    }
  }, [currentJob, useCanvasPlayer, videoError]);

  const handleDownload = () => {
    if (currentJob?.videoUrl) {
      const a = document.createElement('a');
      a.href = currentJob.videoUrl;
      a.download = `Boss_AI_Video_5s_${style.replace(/\s+/g, '_')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (canvasPreviewRef.current) {
      const dataUrl = canvasPreviewRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Boss_AI_Video_Still_${style.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Extract live prompt tokens for Google Flow preview
  const promptTokens = useMemo(() => {
    if (!prompt.trim()) return null;
    const words = prompt.trim();
    return {
      hasAction: /flying|running|drifting|exploding|blooming|speeding|walking|diving|accelerating|charging/i.test(words),
      hasCamera: /drone|orbit|dolly|pan|fpv|close-up|wide|tracking|aerial|crane/i.test(words),
      hasLighting: /neon|golden hour|sunset|cinematic|volumetric|cyberpunk|dramatic|studio|bioluminescent/i.test(words),
    };
  }, [prompt]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-500/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 text-rose-500">
                <Video className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-display font-bold">
                AI Video Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs">
                5s Fast AI Video Architecture
              </span>
            </div>
            <p className="text-xs opacity-70 mt-1">
              Direct and render high-fidelity 5-second cinematic AI videos by prompt deconstruction and temporal optical flow vectors.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              id="view-python-app-btn"
              onClick={() => setShowPythonModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-xs"
              title="View Python Flask AI Video Code (app.py)"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python app.py</span>
            </button>

            <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-400 font-semibold flex items-center gap-1 border border-rose-500/20">
              <Clock className="w-3.5 h-3.5" /> 5.0s Fast Sequence
            </span>
          </div>
        </div>

        {/* Configuration & Prompt Panel */}
        <div className={`p-5 rounded-3xl border shadow-sm ${
          isDarkMode ? 'bg-[#1e1f20] border-[#333537]' : 'bg-white border-gray-200'
        }`}>
          {/* Generation Engine Selector */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/10 dark:bg-white/5 border border-gray-500/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold opacity-70">Generation Engine:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 dark:bg-black/40 border border-gray-500/20">
                <button
                  type="button"
                  onClick={() => setEngineMode('veo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    engineMode === 'veo'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Veo 3.1</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">Official</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEngineMode('flow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    engineMode === 'flow'
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Flow Studio</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">60fps</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] opacity-75 font-medium flex items-center gap-1.5">
              {engineMode === 'veo' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span>Google Veo 3.1 & GenAI (Prompt + Image → MP4 Video)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span>Real-time 60fps Multi-Scene Canvas & Spatial Audio Engine</span>
                </>
              )}
            </div>
          </div>

          {/* Preset Prompts Chips */}
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold opacity-60 uppercase mr-1 whitespace-nowrap">
              Flow Presets:
            </span>
            {presetPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p.text)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-colors border ${
                  prompt === p.text
                    ? 'bg-rose-500 text-white border-rose-500 font-medium'
                    : isDarkMode
                    ? 'bg-[#28292a] hover:bg-[#333537] border-[#3e4042] text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Prompt Header & Actions */}
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold opacity-80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              Directorial Video Prompt
            </label>
            <button
              id="enhance-flow-prompt-btn"
              onClick={handleEnhancePrompt}
              disabled={isEnhancingPrompt || !prompt.trim()}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
                isEnhancingPrompt
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-gradient-to-r from-rose-500/15 to-purple-500/15 text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/50'
              }`}
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              <span>{isEnhancingPrompt ? 'Directing AI Tokens...' : 'Enhance with AI Video'}</span>
            </button>
          </div>

          {/* Prompt Textarea */}
          <div className="relative mb-2">
            <textarea
              id="video-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe ANY action (e.g., 'A lion is dancing', 'A cat doing karate', 'A robot playing electric guitar')... The AI translates your prompt directly into dynamic kinetic video!"
              rows={3}
              className={`w-full p-4 rounded-2xl text-sm outline-none resize-none border transition-all focus:ring-2 focus:ring-rose-500/40 ${
                isDarkMode
                  ? 'bg-[#131314] border-[#37393b] text-white placeholder-gray-500'
                  : 'bg-[#f8fafc] border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Live Prompt Token Breakdown Preview */}
          {prompt.trim() && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="opacity-60 font-semibold uppercase">Flow Tokens:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20 font-medium">
                [Subject & Action Detection]
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-medium">
                [Temporal Vectors: 5.0s]
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                [2-Keyframe Latent Continuity]
              </span>
              {promptTokens?.hasLighting && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                  [Atmospheric Volumetric Engine]
                </span>
              )}
            </div>
          )}

          {/* Reference Image Input (Prompt + Image -> Video) */}
          <div className="mb-5 p-3.5 rounded-2xl border border-dashed border-gray-500/20 bg-black/5 dark:bg-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold opacity-90 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Reference Starting Photo (Prompt + Image → Video)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Optional</span>
              </label>
              {referenceImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove Image
                </button>
              )}
            </div>

            <input
              id="image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {!referenceImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-3.5 rounded-xl border-2 border-dashed cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${
                  isDarkMode
                    ? 'border-[#3e4042] hover:border-rose-500/50 bg-[#1e1f20]/60 hover:bg-[#28292a]'
                    : 'border-gray-300 hover:border-rose-400 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">
                      Click to upload starting photo or keyframe
                    </div>
                    <p className="text-[11px] opacity-60">
                      Supports JPG, PNG, WebP. The AI will start the video directly from this image and animate forward!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all shrink-0"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-rose-500/40">
                  <img
                    src={referenceImage}
                    alt="Starting Keyframe"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate text-rose-400">
                    {referenceFileName || 'Uploaded Photo'}
                  </div>
                  <p className="text-[11px] opacity-70">
                    Anchor Keyframe 1 set. Video will animate from this photograph with 35mm optical motion!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-xs">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: '16:9', label: '16:9', sub: 'Cinema' },
                  { id: '9:16', label: '9:16', sub: 'Shorts' },
                  { id: '1:1', label: '1:1', sub: 'Square' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id as any)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                        : isDarkMode
                        ? 'bg-[#131314] border-[#37393b] text-gray-400 hover:text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-black'
                    }`}
                  >
                    <div>{ar.label}</div>
                    <div className="text-[10px] opacity-60">{ar.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
                AI Video Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={`w-full py-2.5 px-3 rounded-xl border outline-none text-xs ${
                  isDarkMode
                    ? 'bg-[#131314] border-[#37393b] text-white'
                    : 'bg-[#f8fafc] border-gray-300 text-gray-900'
                }`}
              >
                <option value="Cinematic 3D">Cinematic 3D</option>
                <option value="Cyberpunk Neon">Cyberpunk Neon City</option>
                <option value="Sci-Fi Futuristic">Sci-Fi Cosmic Odyssey</option>
                <option value="Anime Manga">Anime Dynamic Action</option>
                <option value="Ethereal Fantasy">Ethereal Mystic Fantasy</option>
                <option value="Photorealistic 8K">Photorealistic 8K Film</option>
              </select>
            </div>

            {/* Camera Trajectory */}
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1.5">
                Camera Vector Trajectory
              </label>
              <select
                value={cameraTrajectory}
                onChange={(e) => setCameraTrajectory(e.target.value)}
                className={`w-full py-2.5 px-3 rounded-xl border outline-none text-xs ${
                  isDarkMode
                    ? 'bg-[#131314] border-[#37393b] text-white'
                    : 'bg-[#f8fafc] border-gray-300 text-gray-900'
                }`}
              >
                <option value="35mm Anamorphic Dolly In">35mm Anamorphic Dolly In (Push)</option>
                <option value="Orbit 360 Arc & Drift">Kinetic 360 Orbit & Drift</option>
                <option value="FPV Drone Dive">High-Speed FPV Drone Dive</option>
                <option value="Horizontal Pan Left">Horizontal Pan Left Track</option>
                <option value="Horizontal Pan Right">Horizontal Pan Right Track</option>
                <option value="Sweeping Crane Pedestal Up">Sweeping Crane Pedestal Up</option>
                <option value="Dolly Out Slow Pullback">Dolly Out Slow Pullback</option>
              </select>
            </div>

            {/* Velocity & Optical Vectors Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold opacity-70">
                  Velocity ({flowSpeed}x)
                </label>
                <button
                  type="button"
                  onClick={() => setShowFlowVectors(!showFlowVectors)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${
                    showFlowVectors
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                      : 'bg-gray-500/10 text-gray-400 border-transparent hover:border-gray-500/30'
                  }`}
                >
                  {showFlowVectors ? 'VECTORS: ON' : 'VECTORS: OFF'}
                </button>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={flowSpeed}
                onChange={(e) => setFlowSpeed(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-gray-500/20 cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[9px] opacity-60">
                <span>Slow Drift</span>
                <span>Hyperkinetic</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs opacity-70">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>
                {engineMode === 'veo'
                  ? 'Google Veo 3.1: 8-second cinematic AI video + starting frame + audio'
                  : 'Flow Studio: 5s continuous motion + prompt identification + audio'}
              </span>
            </div>

            <button
              id="generate-video-btn"
              onClick={handleGenerateVideo}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isGenerating
                  ? 'bg-gray-500/30 text-gray-400 cursor-not-allowed'
                  : engineMode === 'veo'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:brightness-110 active:scale-98 shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white hover:brightness-110 active:scale-98'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {engineMode === 'veo' ? 'Generating with Veo 3.1' : 'Rendering Video'} ({renderProgress}%)
                  </span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>{engineMode === 'veo' ? 'Generate Video with Google Veo' : 'Generate 5s AI Video'}</span>
                </>
              )}
            </button>
          </div>

          {/* Live Render Progress Bar */}
          {isGenerating && (
            <div className="mt-4 pt-4 border-t border-gray-500/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  {veoStatusText
                    ? veoStatusText
                    : renderSecond < 2.5
                    ? 'Deconstructing Prompt & Synthesizing Flow Genesis...'
                    : 'Interpolating Optical Flow Vectors & Mastering Audio...'}
                </span>
                <span className="text-mono opacity-80">
                  {engineMode === 'veo' ? `${renderSecond.toFixed(0)}s elapsed` : `${renderSecond.toFixed(1)}s / 5.0s`} ({renderProgress}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-500/20 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    engineMode === 'veo'
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400'
                      : 'bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400'
                  }`}
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] opacity-70 text-center pt-1">
                <div className={renderSecond >= 0 && renderSecond < 20 ? 'text-indigo-400 font-bold' : ''}>
                  {engineMode === 'veo' ? 'Phase 1: Neural Prompt & Image Ingestion' : '0.0s - 2.5s: Flow Vector Initiation'}
                </div>
                <div className={renderSecond >= 20 ? 'text-indigo-400 font-bold' : ''}>
                  {engineMode === 'veo' ? 'Phase 2: Veo Latent Diffusion & MP4 Encoding' : '2.5s - 5.0s: Flow Apex & Resolution'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Player & Results */}
        {currentJob && (currentJob.videoUrl || currentJob.status === 'ready') && (
          <div className={`p-6 rounded-3xl border shadow-lg space-y-5 animate-in fade-in duration-300 ${
            isDarkMode ? 'bg-[#1e1f20] border-[#333537]' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-500/10">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold">5-Second AI Video Ready</h2>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-bold">5.0s</span>
                </div>
                <p className="text-xs opacity-60 mt-0.5 truncate max-w-lg">
                  {currentJob.prompt}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {onSendToImage && (
                  <button
                    id="send-to-image-btn"
                    onClick={() => onSendToImage(currentJob.prompt)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all shadow-sm"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Create Still in DALL-E</span>
                  </button>
                )}

                <button
                  id="download-video-btn"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{currentJob.videoUrl ? 'Download 5s (WebM)' : 'Download Frame (PNG)'}</span>
                </button>
              </div>
            </div>

            {/* Custom Video Player Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center aspect-video max-h-[480px] shadow-inner group">
              {(!videoError && !useCanvasPlayer && currentJob.videoUrl) ? (
                <video
                  ref={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onError={(e) => {
                    // Prevent unhandled DOM error and switch to high-performance Canvas player
                    e.preventDefault?.();
                    console.warn('HTML5 video source not supported or failed to load. Switching to high-performance Canvas player.');
                    setVideoError(true);
                    setUseCanvasPlayer(true);
                  }}
                  onEnded={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play().catch(() => {});
                    }
                  }}
                  loop
                  className="w-full h-full object-contain"
                  playsInline
                >
                  <source
                    src={currentJob.videoUrl}
                    type={currentJob.blob?.type || 'video/webm'}
                    onError={() => {
                      setVideoError(true);
                      setUseCanvasPlayer(true);
                    }}
                  />
                </video>
              ) : (
                <canvas
                  ref={canvasPreviewRef}
                  className="w-full h-full object-contain"
                  width={currentJob.aspectRatio === '9:16' ? 720 : currentJob.aspectRatio === '1:1' ? 800 : 1280}
                  height={currentJob.aspectRatio === '9:16' ? 1280 : currentJob.aspectRatio === '1:1' ? 800 : 720}
                />
              )}

              {/* Player Mode Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white/90 backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {useCanvasPlayer || videoError ? 'Direct Canvas Engine (60fps)' : 'HTML5 Video'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !(useCanvasPlayer || videoError);
                    setUseCanvasPlayer(nextVal);
                    if (nextVal && videoRef.current) {
                      videoRef.current.pause();
                    }
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 hover:bg-black/80 text-rose-300 backdrop-blur-sm border border-rose-500/20 transition-all"
                  title="Toggle player engine"
                >
                  Switch Player
                </button>
              </div>

              {/* Video Overlay Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </div>
              </button>

              {/* Video Player Timeline Bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2">
                <div className="flex items-center gap-3 text-xs text-white">
                  <button onClick={togglePlay} className="hover:text-rose-400">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Scrubber slider (0 to 5 seconds) */}
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.05}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 rounded-lg appearance-none bg-white/30 cursor-pointer accent-rose-500"
                  />

                  {/* Timecode */}
                  <span className="text-[11px] font-mono text-gray-200">
                    00:0{Math.floor(currentTime)}.{Math.floor((currentTime % 1) * 10)} / 05.00
                  </span>

                  <button
                    onClick={() => {
                      if (videoRef.current && !useCanvasPlayer && !videoError) {
                        videoRef.current.requestFullscreen?.();
                      } else if (canvasPreviewRef.current) {
                        canvasPreviewRef.current.requestFullscreen?.();
                      }
                    }}
                    className="hover:text-rose-400"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Google Flow Directives: AI Identified Prompt Breakdown */}
            {currentJob.analysis && (
              <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
                isDarkMode ? 'bg-[#131314] border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-rose-500 uppercase tracking-wider text-[11px]">
                      AI Video Directives (Prompt Analysis)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold">
                    AI Video Tokenizer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Subject</span>
                    <p className="font-semibold text-rose-400">{currentJob.analysis.subject}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Kinetic Action</span>
                    <p className="font-semibold text-emerald-400">{currentJob.analysis.action || 'Forward motion'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Setting</span>
                    <p className="font-semibold">{currentJob.analysis.setting}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Camera Vector</span>
                    <p className="font-semibold text-cyan-400">{currentJob.analysis.camera}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Atmosphere & Lens</span>
                    <p className="font-semibold text-amber-400">{currentJob.analysis.lens || '35mm Anamorphic'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5-Second 2-Keyframe Storyboard Breakdown */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                AI Video 5-Second Keyframe Trajectory
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentJob.scenes.map((sc, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border text-xs overflow-hidden flex flex-col ${
                      isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Keyframe Image */}
                    {sc.imageUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                        <img
                          src={sc.imageUrl}
                          alt={sc.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">
                            {i === 0
                              ? currentJob.referenceImage
                                ? 'Anchor Keyframe 1 (Uploaded Photo)'
                                : 'Anchor Keyframe 1'
                              : 'Anchor Keyframe 2'}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500 text-white font-bold backdrop-blur-sm">
                            {sc.timeRange || (i === 0 ? '0.0s - 2.5s' : '2.5s - 5.0s')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 pb-0 flex items-center justify-between font-bold text-rose-400">
                        <span>
                          {i === 0
                            ? currentJob.referenceImage
                              ? 'Keyframe 1: Uploaded Photo Genesis'
                              : 'Keyframe 1: Flow Genesis'
                            : 'Keyframe 2: Flow Apex'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10">
                          {sc.timeRange || (i === 0 ? '0.0s - 2.5s' : '2.5s - 5.0s')}
                        </span>
                      </div>
                    )}

                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="font-semibold text-[13px]">{sc.title}</div>
                        <p className="text-[11px] opacity-75 line-clamp-3 mt-1">
                          {sc.visualDesc}
                        </p>
                      </div>
                      <div className="text-[10px] text-cyan-400 font-medium italic pt-2 border-t border-gray-500/10">
                        Cam: {sc.cameraMotion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Python Flask AI Video Modal (app.py) */}
      {showPythonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDarkMode ? 'bg-[#18191b] border-[#333537] text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FileVideo className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    AI Video Generator Python Script (app.py)
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400">
                      Google Veo 3.1 + Flask
                    </span>
                  </h3>
                  <p className="text-xs opacity-60">
                    Prompt + Image → Video local web application with HTML UI, Veo 3.1 generation, and /generate API
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPythonModal(false)}
                className="p-2 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-500/10">
                <div>
                  <span className="font-semibold text-emerald-400">Setup Instructions:</span>
                  <p className="opacity-70 mt-0.5">
                    1. Install: <code className="font-mono bg-black/20 dark:bg-black/40 px-1 py-0.5 rounded">pip install flask google-genai python-dotenv requests</code>
                    <br />
                    2. In <code className="font-mono">.env</code>: <code className="font-mono">GEMINI_API_KEY=your_key</code>
                    <br />
                    3. Run: <code className="font-mono">python scripts/app.py</code> (starts web UI on http://localhost:5000)
                  </p>
                </div>
                <button
                  onClick={handleCopyPythonCode}
                  className="px-3.5 py-2 rounded-xl font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Code display */}
              <div className="relative rounded-2xl overflow-hidden bg-black/90 text-gray-200 border border-gray-800 font-mono text-[11px] leading-relaxed p-4 max-h-[50vh] overflow-y-auto">
                <pre>{FLASK_VIDEO_APP_PY}</pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-500/10 flex items-center justify-between text-xs">
              <span className="opacity-60">
                Saved locally at: <code className="font-mono text-emerald-400">scripts/app.py</code>
              </span>
              <button
                onClick={() => setShowPythonModal(false)}
                className="px-4 py-2 rounded-xl font-semibold bg-gray-500/20 hover:bg-gray-500/30 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
