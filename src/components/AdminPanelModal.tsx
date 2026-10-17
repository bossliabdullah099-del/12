import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Server,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isDarkMode: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isDarkMode,
}) => {
  const [temperature, setTemperature] = useState(0.7);
  const [contextWindow, setContextWindow] = useState('1M Tokens');
  const [turboMode, setTurboMode] = useState(true);
  const [gpuBoost, setGpuBoost] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={`max-w-2xl w-full rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#1e1f20] border-[#37393b] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg">BOSS AURA AI Super Admin</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                  ROOT
                </span>
              </div>
              <p className="text-xs opacity-60">
                {currentUser?.email || 'bossliabdullah099@gmail.com'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-gray-500/10 transition-colors ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Model Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 text-xs text-blue-400 font-bold mb-1">
                <Cpu className="w-4 h-4" />
                <span>Model Engine</span>
              </div>
              <div className="text-sm font-semibold">BOSS AURA AI</div>
              <div className="text-[11px] opacity-60 mt-0.5">Enterprise Root Edition</div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-1">
                <Activity className="w-4 h-4" />
                <span>Inference Engine</span>
              </div>
              <div className="text-sm font-semibold">Gemini 3.8 Flash</div>
              <div className="text-[11px] opacity-60 mt-0.5">Hardware Accelerated</div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
                <Server className="w-4 h-4" />
                <span>Quota Level</span>
              </div>
              <div className="text-sm font-semibold text-emerald-400">Unlimited (Free)</div>
              <div className="text-[11px] opacity-60 mt-0.5">Priority Queue VIP</div>
            </div>
          </div>

          {/* Model Parameter Controls */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDarkMode ? 'bg-[#131314] border-[#2e2f33]' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Runtime Tuning Controls
            </h3>

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Creativity Temperature: {temperature}</span>
                <span className="opacity-60 font-mono text-[11px]">Default: 0.7</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none bg-gray-500/20 accent-amber-400"
              />
            </div>

            {/* Context Window */}
            <div className="flex items-center justify-between text-xs">
              <span>Active Context Window</span>
              <div className="flex gap-1">
                {['128K', '1M Tokens'].map((cw) => (
                  <button
                    key={cw}
                    onClick={() => setContextWindow(cw)}
                    className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${
                      contextWindow === cw
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'opacity-60'
                    }`}
                  >
                    {cw}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-500/10">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>BOSS AURA AI Turbo Generation Mode</span>
              </div>
              <input
                type="checkbox"
                checked={turboMode}
                onChange={(e) => setTurboMode(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Hardware WebGL Shader Acceleration</span>
              </div>
              <input
                type="checkbox"
                checked={gpuBoost}
                onChange={(e) => setGpuBoost(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Admin Notice */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2.5 text-blue-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Super Admin Session Verified:</span>
              <p className="opacity-80 mt-0.5">
                Logged in as Ali Abdullah Tariq. All multimedia pipelines (20s Video, 4K Image, Multi-track Synthesizer, Video Editor) are fully accessible with zero cost and maximum throughput.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-500/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-500/20 hover:bg-gray-500/30 transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
