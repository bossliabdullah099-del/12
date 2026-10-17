import React from 'react';
import {
  Code2,
  Tv,
  Coins,
  Sparkles,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Gift,
} from 'lucide-react';

interface CodeOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  credits: number;
  onChooseCredit: () => void;
  onChooseWatchAd: () => void;
  onOpenDailyCredits?: () => void;
  isDarkMode: boolean;
}

export const CodeOptionModal: React.FC<CodeOptionModalProps> = ({
  isOpen,
  onClose,
  promptText,
  credits,
  onChooseCredit,
  onChooseWatchAd,
  onOpenDailyCredits,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const hasCredits = credits >= 1;
  const isProgram = /\b(program|programs|programming|programme|programmes)\b/i.test(promptText);
  const term = isProgram ? 'Program' : 'Code';

  return (
    <div
      id="code-option-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="code-option-modal-card"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 relative transition-all animate-scaleUp ${
          isDarkMode
            ? 'bg-[#18191c] border-[#2f3136] text-white shadow-black/80'
            : 'bg-white border-gray-200 text-gray-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] shadow-md shrink-0">
            <div
              className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isDarkMode ? 'bg-[#18191c]' : 'bg-white'
              }`}
            >
              <Code2 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                BOSS AURA AI • {isProgram ? 'Program Generation' : 'Code Generation'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Required Option
              </span>
            </div>
            <h3 className="text-lg font-bold">Write {term} with BOSS AURA AI</h3>
          </div>
        </div>

        {/* User's Prompt Preview Box */}
        <div
          className={`p-3 rounded-2xl border mb-5 text-xs font-mono leading-relaxed max-h-24 overflow-y-auto ${
            isDarkMode
              ? 'bg-[#121316] border-[#27282e] text-blue-300/90'
              : 'bg-blue-50/60 border-blue-200/60 text-blue-900'
          }`}
        >
          <div className="text-[10px] font-sans font-bold uppercase opacity-50 mb-1">
            {term} Request Detected:
          </div>
          <p className="line-clamp-3">"{promptText}"</p>
        </div>

        <p className="text-xs opacity-75 mb-4 text-center">
          How would you like BOSS AURA AI to write this {term.toLowerCase()}? Choose one option:
        </p>

        {/* Two Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Option 1: Give 1 Credit */}
          <div
            onClick={() => {
              if (hasCredits) {
                onChooseCredit();
              }
            }}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative group ${
              hasCredits
                ? isDarkMode
                  ? 'bg-gradient-to-b from-[#1e2230] to-[#171a24] border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer'
                  : 'bg-gradient-to-b from-blue-50 to-indigo-50/40 border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer'
                : 'opacity-60 border-gray-500/30 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Coins className="w-5 h-5 text-blue-400" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                  Instant
                </span>
              </div>
              <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">
                <span>Write by 1 Credit</span>
              </h4>
              <p className="text-[11px] opacity-70 leading-relaxed mb-3">
                Use 1 credit from your daily balance to generate {term.toLowerCase()} immediately with zero ads.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-500/15">
              <div className="flex items-center justify-between text-[11px] font-medium mb-2.5">
                <span className="opacity-70">Your Balance:</span>
                <span
                  className={`font-bold font-mono ${
                    hasCredits ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {credits} Credits
                </span>
              </div>

              {hasCredits ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChooseCredit();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all group-hover:scale-[1.02]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Give 1 Credit & Write</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenDailyCredits) onOpenDailyCredits();
                  }}
                  className="w-full py-1.5 px-2 rounded-xl bg-gray-500/20 text-gray-400 font-semibold text-[11px] flex items-center justify-center gap-1 hover:text-amber-300 transition-colors"
                >
                  <Gift className="w-3 h-3 text-amber-400" />
                  <span>Get Daily Credits</span>
                </button>
              )}
            </div>
          </div>

          {/* Option 2: Watch Ad (Free) */}
          <div
            onClick={onChooseWatchAd}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative cursor-pointer group ${
              isDarkMode
                ? 'bg-gradient-to-b from-[#251f18] to-[#1a1714] border-amber-500/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                : 'bg-gradient-to-b from-amber-50 to-orange-50/40 border-amber-300 hover:border-amber-500 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Tv className="w-5 h-5 text-amber-400" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  100% Free
                </span>
              </div>
              <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">
                <span>Watch Ad to Write</span>
              </h4>
              <p className="text-[11px] opacity-70 leading-relaxed mb-3">
                Watch a quick 5-second sponsor ad to write your {term.toLowerCase()} for free without using any credits.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-500/15">
              <div className="flex items-center justify-between text-[11px] font-medium mb-2.5">
                <span className="opacity-70">Credit Cost:</span>
                <span className="font-bold font-mono text-emerald-400">0 Credits (Free)</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChooseWatchAd();
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all group-hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Watch Ad & Write {term}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Daily Mission info note */}
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
            isDarkMode ? 'bg-[#141518] border-[#26272c]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="opacity-80">
              Need more credits? Check <strong>Daily Credits</strong> in the top-left corner!
            </span>
          </div>
          {onOpenDailyCredits && (
            <button
              onClick={() => {
                onClose();
                onOpenDailyCredits();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold whitespace-nowrap pl-2 flex items-center gap-0.5"
            >
              <span>Missions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
