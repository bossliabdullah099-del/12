import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { DeviceAspectRatio, DisplayDeviceCategory, DeviceRatioInfo } from '../types';

export const DEVICE_RATIOS_LIST: DeviceRatioInfo[] = [
  // 1. Desktop & Laptops: 16:10 / 3:2
  {
    ratio: '16:10',
    label: '16:10',
    category: 'desktop',
    categoryLabel: 'Desktop & Laptops',
    sub: 'MacBook & Widescreen',
    exampleResolution: '1280×800 / 1920×1200',
    isPrimary: true,
  },
  {
    ratio: '3:2',
    label: '3:2',
    category: 'desktop',
    categoryLabel: 'Desktop & Laptops',
    sub: 'Surface & Productivity',
    exampleResolution: '1200×800 / 1500×1000',
    isPrimary: false,
  },

  // 2. Tablets / iPads: 4:3 or 16:10
  {
    ratio: '4:3',
    label: '4:3',
    category: 'tablet',
    categoryLabel: 'Tablets / iPads',
    sub: 'Apple iPad & Classic',
    exampleResolution: '1152×864 / 1024×768',
    isPrimary: true,
  },
  {
    ratio: '16:10',
    label: '16:10',
    category: 'tablet',
    categoryLabel: 'Tablets / iPads',
    sub: 'Android & iPad Landscape',
    exampleResolution: '1280×800 / 2560×1600',
    isPrimary: false,
  },

  // 3. Mobile Phones: 19.5:9 or 18:9
  {
    ratio: '19.5:9',
    label: '19.5:9',
    category: 'mobile',
    categoryLabel: 'Mobile Phones',
    sub: 'iPhone & Galaxy Flagships',
    exampleResolution: '720×1560 / 1080×2340',
    isPrimary: true,
  },
  {
    ratio: '18:9',
    label: '18:9',
    category: 'mobile',
    categoryLabel: 'Mobile Phones',
    sub: 'FullView 2:1 Smartphones',
    exampleResolution: '720×1440 / 1080×2160',
    isPrimary: false,
  },
];

export function getAutoRatioForWindowWidth(w: number): {
  ratio: DeviceAspectRatio;
  category: DisplayDeviceCategory;
  label: string;
} {
  if (w >= 1024) {
    return { ratio: '16:10', category: 'desktop', label: '16:10 (Desktop & Laptops)' };
  }
  if (w >= 768) {
    return { ratio: '4:3', category: 'tablet', label: '4:3 (Tablets / iPads)' };
  }
  return { ratio: '19.5:9', category: 'mobile', label: '19.5:9 (Mobile Phones)' };
}

interface DeviceAspectRatioBarProps {
  currentRatio: DeviceAspectRatio;
  onChangeRatio: (ratio: DeviceAspectRatio) => void;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  isDarkMode: boolean;
  className?: string;
}

export const DeviceAspectRatioBar: React.FC<DeviceAspectRatioBarProps> = ({
  currentRatio,
  onChangeRatio,
  isFrameMode,
  onToggleFrameMode,
  isDarkMode,
  className = '',
}) => {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const autoDetected = getAutoRatioForWindowWidth(windowWidth);
  const effectiveRatio = currentRatio === 'auto' ? autoDetected.ratio : currentRatio;

  return (
    <div
      id="device-aspect-ratio-bar"
      className={`border-b transition-colors select-none ${
        isDarkMode
          ? 'bg-[#151618] border-[#26272b] text-gray-200'
          : 'bg-[#f4f7fb] border-gray-200 text-gray-800'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Device Standards Status Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold">ASPECT RATIO</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] opacity-75">
            <span>Standard:</span>
            <span className="font-semibold text-blue-400">16:10 / 3:2</span> (Desktop)
            <span className="opacity-40">·</span>
            <span className="font-semibold text-purple-400">4:3 / 16:10</span> (Tablet)
            <span className="opacity-40">·</span>
            <span className="font-semibold text-emerald-400">19.5:9 / 18:9</span> (Mobile)
          </div>
        </div>

        {/* Center / Right: Interactive Quick Ratio Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Auto Mode button */}
          <button
            id="ratio-btn-auto"
            onClick={() => onChangeRatio('auto')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              currentRatio === 'auto'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : isDarkMode
                ? 'bg-[#1f2023] hover:bg-[#28292d] text-gray-300 border border-[#2f3136]'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
            title={`Auto detect screen ratio (Currently: ${autoDetected.label})`}
          >
            <span>Auto</span>
            {currentRatio === 'auto' && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 font-mono font-bold">
                {effectiveRatio}
              </span>
            )}
          </button>

          {/* 1. Desktop & Laptops: 16:10 / 3:2 */}
          <div className="flex items-center rounded-lg border border-blue-500/30 overflow-hidden bg-blue-500/5">
            <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-blue-400 font-semibold bg-blue-500/10">
              <Laptop className="w-3 h-3 text-blue-400" />
              <span className="hidden md:inline">Desktop:</span>
            </div>
            <button
              id="ratio-btn-16-10"
              onClick={() => onChangeRatio('16:10')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '16:10' && currentRatio !== 'auto'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'hover:bg-blue-500/20 text-blue-300'
              }`}
              title="16:10 - MacBook & Modern Widescreen Laptops"
            >
              16:10
            </button>
            <span className="text-[9px] opacity-30">/</span>
            <button
              id="ratio-btn-3-2"
              onClick={() => onChangeRatio('3:2')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '3:2' && currentRatio !== 'auto'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'hover:bg-blue-500/20 text-blue-300'
              }`}
              title="3:2 - Microsoft Surface & Productivity Laptops"
            >
              3:2
            </button>
          </div>

          {/* 2. Tablets / iPads: 4:3 or 16:10 */}
          <div className="flex items-center rounded-lg border border-purple-500/30 overflow-hidden bg-purple-500/5">
            <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-purple-400 font-semibold bg-purple-500/10">
              <Tablet className="w-3 h-3 text-purple-400" />
              <span className="hidden md:inline">Tablet:</span>
            </div>
            <button
              id="ratio-btn-4-3"
              onClick={() => onChangeRatio('4:3')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '4:3' && currentRatio !== 'auto'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'hover:bg-purple-500/20 text-purple-300'
              }`}
              title="4:3 - Apple iPad & Classic Tablets"
            >
              4:3
            </button>
            <span className="text-[9px] opacity-30">/</span>
            <button
              id="ratio-btn-tablet-16-10"
              onClick={() => onChangeRatio('16:10')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '16:10' && currentRatio !== 'auto'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'hover:bg-purple-500/20 text-purple-300'
              }`}
              title="16:10 - Android Tablets & iPad Widescreen Landscape"
            >
              16:10
            </button>
          </div>

          {/* 3. Mobile Phones: 19.5:9 or 18:9 */}
          <div className="flex items-center rounded-lg border border-emerald-500/30 overflow-hidden bg-emerald-500/5">
            <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10">
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span className="hidden md:inline">Mobile:</span>
            </div>
            <button
              id="ratio-btn-19-5-9"
              onClick={() => onChangeRatio('19.5:9')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '19.5:9' && currentRatio !== 'auto'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'hover:bg-emerald-500/20 text-emerald-300'
              }`}
              title="19.5:9 - Modern iPhone 14/15/16 & Galaxy S-Series"
            >
              19.5:9
            </button>
            <span className="text-[9px] opacity-30">/</span>
            <button
              id="ratio-btn-18-9"
              onClick={() => onChangeRatio('18:9')}
              className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                effectiveRatio === '18:9' && currentRatio !== 'auto'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'hover:bg-emerald-500/20 text-emerald-300'
              }`}
              title="18:9 - FullView 2:1 Smartphones"
            >
              18:9
            </button>
          </div>

          {/* Frame Mode Toggle (Device Canvas Simulation) */}
          <button
            id="device-frame-toggle-btn"
            onClick={onToggleFrameMode}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
              isFrameMode
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : isDarkMode
                ? 'bg-[#1f2023] hover:bg-[#28292d] text-gray-300 border-[#2f3136]'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
            title={isFrameMode ? 'Switch to Full-Width Layout' : 'Preview in Exact Device Aspect Ratio Frame'}
          >
            {isFrameMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{isFrameMode ? 'Framed' : 'Frame View'}</span>
          </button>

          {/* Info Modal trigger */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-[#28292d] text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Aspect Ratio Standards Info"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Popover / Modal */}
      {showInfoModal && (
        <div
          className={`border-t px-4 py-3 animate-in fade-in-50 duration-200 ${
            isDarkMode ? 'bg-[#18191c] border-[#292a2e]' : 'bg-white border-gray-200'
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Device Aspect Ratio Configuration
              </h4>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div
                className={`p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#1e1f23] border-[#2f3138]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="font-bold text-blue-400 flex items-center gap-1.5 mb-1">
                  <Laptop className="w-3.5 h-3.5" />
                  Desktop & Laptops
                </div>
                <div className="space-y-0.5 text-[11px] opacity-85">
                  <div><strong>16:10</strong>: Modern MacBook Pro/Air, Dell XPS, ThinkPad (1280×800 / 1920×1200 / 2560×1600)</div>
                  <div><strong>3:2</strong>: Microsoft Surface Laptop, MateBook (1200×800 / 1500×1000 / 3000×2000)</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#1e1f23] border-[#2f3138]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="font-bold text-purple-400 flex items-center gap-1.5 mb-1">
                  <Tablet className="w-3.5 h-3.5" />
                  Tablets / iPads
                </div>
                <div className="space-y-0.5 text-[11px] opacity-85">
                  <div><strong>4:3</strong>: Apple iPad Classic, Air & Pro (1152×864 / 2048×1536 / 1024×768)</div>
                  <div><strong>16:10</strong>: Android Tablets, iPad Landscape (1280×800 / 2560×1600)</div>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#1e1f23] border-[#2f3138]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile Phones
                </div>
                <div className="space-y-0.5 text-[11px] opacity-85">
                  <div><strong>19.5:9</strong>: iPhone 14/15/16, Samsung Galaxy S23/S24 (720×1560 / 1080×2340)</div>
                  <div><strong>18:9</strong>: FullView 2:1 Smartphones (720×1440 / 1080×2160)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
