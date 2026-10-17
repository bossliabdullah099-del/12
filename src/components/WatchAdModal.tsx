import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Sparkles, X, Volume2, VolumeX, ShieldCheck, ExternalLink, Zap } from 'lucide-react';

interface WatchAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
  isDarkMode: boolean;
  purpose?: string;
}

const SPONSORS = [
  {
    name: 'AuraCloud Engine',
    category: 'Cloud GPU & Microservices',
    headline: 'Deploy High-Performance Polyglot APIs in Under 60 Seconds',
    tagline: 'Zero configuration, automatic scale-to-zero, and 99.99% uptime guaranteed for developer teams.',
    cta: 'Explore AuraCloud Dev Tier',
    accent: 'from-blue-600 via-indigo-600 to-violet-600',
    iconColor: '#3b82f6',
  },
  {
    name: 'ByteMatrix AI',
    category: 'Developer Intelligence',
    headline: 'Next-Gen Automated Code Review & Security Hardening',
    tagline: 'Detect vulnerabilities across Rust, Python, Go, and C++ before your code reaches production.',
    cta: 'Get Free Developer License',
    accent: 'from-purple-600 via-pink-600 to-rose-600',
    iconColor: '#ec4899',
  },
  {
    name: 'QuantumDB Systems',
    category: 'Distributed Database',
    headline: 'Ultra-low latency sub-millisecond ACID transactions globally',
    tagline: 'Built specifically for high-concurrency microservices, real-time analytics, and AI agents.',
    cta: 'Start Free Sandbox Cluster',
    accent: 'from-emerald-600 via-teal-600 to-cyan-600',
    iconColor: '#10b981',
  },
];

export const WatchAdModal: React.FC<WatchAdModalProps> = ({
  isOpen,
  onClose,
  onAdCompleted,
  isDarkMode,
  purpose = 'Write Code for Free',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSponsorIndex] = useState(() => Math.floor(Math.random() * SPONSORS.length));

  const sponsor = SPONSORS[currentSponsorIndex];

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      setIsCompleted(false);
      return;
    }

    setSecondsLeft(5);
    setIsCompleted(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    onAdCompleted();
    onClose();
  };

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDarkMode ? 'bg-[#18191c] border-[#2f3136] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Ad Header Banner */}
        <div className="px-5 py-3 border-b flex items-center justify-between bg-black/20 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
              Sponsored Ad
            </span>
            <span className="text-gray-400 text-[11px]">Watch full 5s to {purpose}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded text-gray-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {isCompleted ? (
              <button
                onClick={onClose}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[11px] font-mono text-gray-400">
                Skip in {secondsLeft}s
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Video/Ad Screen Showcase */}
        <div className={`relative h-56 bg-gradient-to-tr ${sponsor.accent} p-6 flex flex-col justify-between text-white overflow-hidden shadow-inner`}>
          {/* Subtle animated floating glow shapes */}
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/20 blur-xl" />

          {/* Top Tag & Sound Wave */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{sponsor.name}</span>
            </div>
            <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {sponsor.category}
            </span>
          </div>

          {/* Main Headline & Pitch */}
          <div className="relative z-10 space-y-1.5 my-auto">
            <h3 className="text-xl font-bold tracking-tight leading-snug drop-shadow-sm">
              {sponsor.headline}
            </h3>
            <p className="text-xs text-white/85 line-clamp-2 max-w-md drop-shadow-xs">
              {sponsor.tagline}
            </p>
          </div>

          {/* Bottom Bar: Action link & Status */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-xs">
            <span className="text-[11px] text-white/90 font-medium flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {sponsor.cta}
            </span>
            <span className="text-[10px] text-white/80 font-mono">
              BOSS AURA Verified Partner
            </span>
          </div>

          {/* Progress bar line along bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
            <div
              className="h-full bg-amber-400 transition-all duration-1000 ease-linear shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ad Finished! Free Generation Unlocked</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Zap className="w-4 h-4 animate-bounce" />
                  <span>Watching ad... ({secondsLeft}s remaining)</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              Reward: 1 Free Code
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                isDarkMode ? 'border-[#33353b] hover:bg-[#25272c] text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              Cancel
            </button>

            <button
              disabled={!isCompleted}
              onClick={handleClaim}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer animate-pulse'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Claim & Write Code Now (Free)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Please Wait ({secondsLeft}s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
