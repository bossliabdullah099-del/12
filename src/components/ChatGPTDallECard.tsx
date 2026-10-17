import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  Video,
  Copy,
  Check,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Wand2,
  Layers,
} from 'lucide-react';

interface ChatGPTDallECardProps {
  mediaData: {
    url: string;
    prompt: string;
    enhancedPrompt?: string;
    style?: string;
    aspectRatio?: string;
    sourceImage?: string;
    isRemix?: boolean;
  };
  isDarkMode: boolean;
  onSelectImagePreview: (url: string) => void;
  onPreloadImagePrompt: (prompt: string, referenceImage?: string) => void;
  onPreloadVideoPrompt: (prompt: string) => void;
  onFollowUpPrompt?: (prompt: string, referenceImage?: string) => void;
}

export const ChatGPTDallECard: React.FC<ChatGPTDallECardProps> = ({
  mediaData,
  isDarkMode,
  onSelectImagePreview,
  onPreloadImagePrompt,
  onPreloadVideoPrompt,
  onFollowUpPrompt,
}) => {
  const [showRevisedPrompt, setShowRevisedPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const revisedPromptText = mediaData.enhancedPrompt || mediaData.prompt;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaData.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ChatGPT_DALLE3_${mediaData.prompt.slice(0, 25).replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(mediaData.url, '_blank');
    }
  };

  const quickFollowUps = [
    'Make it more vibrant and colorful',
    'Switch to Japanese anime style',
    'Transform into a moody night scene',
    'Render as a classical oil painting',
    'Add cyberpunk neon accents and rain',
  ];

  return (
    <div className="mt-4 pt-3 border-t border-gray-500/15">
      <div
        className={`rounded-2xl overflow-hidden border shadow-sm transition-all ${
          isDarkMode ? 'border-[#333537] bg-[#171717]' : 'border-gray-200 bg-gray-50/80'
        }`}
      >
        {/* ChatGPT DALL-E 3 Header */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-500/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
              ✦
            </span>
            <span className="font-bold text-emerald-500 flex items-center gap-1.5">
              <span>ChatGPT DALL-E 3</span>
            </span>
            {mediaData.isRemix && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>Gallery Photo Remix</span>
              </span>
            )}
          </div>
          <span className="text-[10px] opacity-60 font-mono">
            {mediaData.aspectRatio || '1:1 (1024×1024)'}
          </span>
        </div>

        {/* Image Display */}
        <div
          className="relative group cursor-pointer bg-black/60 flex items-center justify-center overflow-hidden"
          onClick={() => onSelectImagePreview(mediaData.url)}
        >
          <img
            src={mediaData.url}
            alt={mediaData.prompt}
            className="w-full max-h-[460px] object-contain rounded-none transition-transform duration-300 group-hover:scale-[1.01]"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
            <span className="px-3.5 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Click to Expand</span>
            </span>
          </div>
        </div>

        {/* ChatGPT Signature "Revised Prompt" Accordion */}
        <div className="border-t border-gray-500/10 text-xs">
          <button
            type="button"
            onClick={() => setShowRevisedPrompt(!showRevisedPrompt)}
            className="w-full px-4 py-2 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity text-left"
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ChatGPT Revised Prompt</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] opacity-60">
              <span>{showRevisedPrompt ? 'Hide' : 'Show'}</span>
              {showRevisedPrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showRevisedPrompt && (
            <div
              className={`px-4 py-3 border-t border-gray-500/10 text-[11px] leading-relaxed space-y-2 ${
                isDarkMode ? 'bg-[#121212]' : 'bg-gray-100/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="opacity-90 italic">"{revisedPromptText}"</p>
                <button
                  type="button"
                  onClick={() => handleCopy(revisedPromptText)}
                  className="p-1 rounded-md hover:bg-gray-500/20 text-gray-400 hover:text-white shrink-0"
                  title="Copy revised prompt"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Follow-up Modification Pills (ChatGPT conversational style) */}
        {onFollowUpPrompt && (
          <div className="px-4 py-2 border-t border-gray-500/10 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="opacity-60 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider mr-1">
              Modify:
            </span>
            {quickFollowUps.map((fu, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onFollowUpPrompt(fu, mediaData.url)}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                  isDarkMode
                    ? 'bg-[#202124] border-[#37393b] text-gray-300 hover:text-white hover:border-emerald-500/40'
                    : 'bg-white border-gray-300 text-gray-700 hover:text-black hover:border-emerald-500/40'
                }`}
                title={`Generate modification: "${fu}"`}
              >
                {fu}
              </button>
            ))}
          </div>
        )}

        {/* Action Toolbar */}
        <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-500/10 text-xs">
          <span className="opacity-75 truncate max-w-[200px] text-[11px]">
            {mediaData.prompt}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPreloadImagePrompt(mediaData.prompt, mediaData.url)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                isDarkMode
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
              title="Open in AI Picture Studio to adjust styles, aspect ratios, or remix"
            >
              <ImagePlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Remix in Studio</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-semibold text-xs transition-colors shadow-sm"
              title="Download image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={() => onPreloadVideoPrompt(mediaData.enhancedPrompt || mediaData.prompt)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors ${
                isDarkMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title="Animate into a 5s AI video"
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Animate 5s Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
