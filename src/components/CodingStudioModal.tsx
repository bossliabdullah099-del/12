import React, { useState } from 'react';
import {
  X,
  Search,
  Code2,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Send,
  Zap,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  Play,
  Coins,
  Video,
  Download,
  Flame,
  CheckCircle2,
  AlertCircle,
  Tv,
} from 'lucide-react';
import { PROGRAMMING_LANGUAGES, ProgrammingLanguage } from '../data/languages';
import { CodeBlock } from './CodeBlock';
import { WatchAdModal } from './WatchAdModal';

interface CodingStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
  isDarkMode: boolean;
  onOpenSandbox?: (code: string, language: string) => void;
  credits: number;
  onDeductCredit: (amount?: number) => boolean;
  onOpenDailyCredits?: () => void;
}

const CATEGORIES = [
  'All',
  'Systems',
  'Web & Fullstack',
  'Backend',
  'Mobile',
  'Data & AI',
  'DevOps & Cloud',
  'Database',
  'Smart Contracts',
  'Functional',
  'Scientific',
] as const;

export const CodingStudioModal: React.FC<CodingStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  isDarkMode,
  onOpenSandbox,
  credits,
  onDeductCredit,
  onOpenDailyCredits,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(
    PROGRAMMING_LANGUAGES[0]
  );
  const [activeTab, setActiveTab] = useState<'catalog' | 'generator' | 'converter'>('catalog');

  // Custom Prompt / Task input
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedLanguage, setGeneratedLanguage] = useState<string>('python');
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Watch Ad Modal State
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string>('');

  // Code Converter State
  const [sourceLang, setSourceLang] = useState('python');
  const [targetLang, setTargetLang] = useState('rust');
  const [converterCode, setConverterCode] = useState(
    `def calculate_fibonacci(n: int) -> int:\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a`
  );

  if (!isOpen) return null;

  const filteredLanguages = PROGRAMMING_LANGUAGES.filter((lang) => {
    const matchesCategory =
      selectedCategory === 'All' || lang.category === selectedCategory;
    const matchesSearch =
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.keyFrameworks.some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  // Action: Write Code by Watching Ad
  const handleWriteCodeByWatchingAd = (promptToRun?: string) => {
    const targetPrompt =
      promptToRun ||
      customPrompt ||
      `Write a production-grade, idiomatic ${selectedLanguage.name} implementation of a high-performance system following modern enterprise best practices and strict type safety.`;
    setPendingPrompt(targetPrompt);
    setIsAdOpen(true);
  };

  // Called when ad finishes
  const handleAdFinished = () => {
    setIsAdOpen(false);
    executeCodeGeneration(pendingPrompt || customPrompt, 'ad');
  };

  // Action: Write Code by 1 Credit
  const handleWriteCodeByCredit = (promptToRun?: string) => {
    const targetPrompt =
      promptToRun ||
      customPrompt ||
      `Write a production-grade, idiomatic ${selectedLanguage.name} implementation of a high-performance system following modern enterprise best practices and strict type safety.`;

    if (credits < 1) {
      setGenerationNotice('Insufficient credits! You need 1 credit. Watch an ad for free or claim Daily Credits in top left.');
      setTimeout(() => setGenerationNotice(null), 4000);
      return;
    }

    const deducted = onDeductCredit(1);
    if (!deducted) {
      setGenerationNotice('Credit deduction failed. Please check your credit balance.');
      return;
    }

    executeCodeGeneration(targetPrompt, 'credit');
  };

  // Internal execution of code generation
  const executeCodeGeneration = async (promptText: string, method: 'ad' | 'credit') => {
    setIsGenerating(true);
    setGeneratedCode(null);
    setActiveTab('generator');

    if (method === 'ad') {
      setGenerationNotice('🎉 Free Generation Granted via Ad! Generating code now...');
    } else {
      setGenerationNotice(`⚡ 1 Credit Deducted (Remaining: ${credits - 1} CR). Generating code now...`);
    }

    try {
      // Call BOSS AURA AI API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${promptText}\n\nLanguage requested: ${selectedLanguage.name}. Please write complete, working, production-ready code with explanatory comments and instructions.`,
          conversationHistory: [],
          model: 'BOSS AURA AI Polyglot',
        }),
      });

      const data = await res.json();
      const codeOutput = data?.reply || data?.text || data?.code;
      if (codeOutput && typeof codeOutput === 'string' && codeOutput.trim()) {
        setGeneratedCode(codeOutput.trim());
        setGeneratedLanguage(selectedLanguage.highlightKey);
      } else {
        // Fallback to sample code
        setGeneratedCode(selectedLanguage.sampleCode);
        setGeneratedLanguage(selectedLanguage.highlightKey);
      }
    } catch (err) {
      console.error('Error generating code:', err);
      // High quality fallback sample
      setGeneratedCode(selectedLanguage.sampleCode);
      setGeneratedLanguage(selectedLanguage.highlightKey);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationNotice(null), 4000);
    }
  };

  const handleConvertSubmit = (mode: 'ad' | 'credit') => {
    const prompt = `Please convert this ${sourceLang.toUpperCase()} code into professional, idiomatic ${targetLang.toUpperCase()} with full type safety, modern best practices, and explain any architectural or performance differences:\n\n\`\`\`${sourceLang}\n${converterCode}\n\`\`\``;
    
    if (mode === 'ad') {
      handleWriteCodeByWatchingAd(prompt);
    } else {
      handleWriteCodeByCredit(prompt);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className={`w-full max-w-6xl h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
            isDarkMode
              ? 'bg-[#161719] border-[#292a2e] text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-[#292a2e] bg-[#1a1b1e]' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] shadow-sm">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isDarkMode ? 'bg-[#18191c]' : 'bg-white'
                  }`}
                >
                  <Code2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Coding Studio</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    25+ Languages Supported
                  </span>
                </div>
                <p className="text-xs opacity-65">
                  BOSS AURA AI Professional Code Generation · Watch an ad for free or use 1 credit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Daily Credit Balance & Shortcut */}
              <button
                onClick={onOpenDailyCredits}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 ${
                  isDarkMode
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                }`}
                title="View Daily Credit Missions (Earn 10-120 Credits)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{credits} Credits</span>
                <span className="text-[10px] bg-amber-500/20 px-1 rounded text-amber-400 font-mono">
                  +Daily
                </span>
              </button>

              {/* Tab switch */}
              <div
                className={`p-1 rounded-xl flex items-center gap-1 border ${
                  isDarkMode ? 'bg-[#222327] border-[#2d2e33]' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'catalog'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  Languages Catalog
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'generator'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Code Output</span>
                </button>
                <button
                  onClick={() => setActiveTab('converter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'converter'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Code Translator</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? 'hover:bg-[#25262a] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          {generationNotice && (
            <div
              className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between transition-all ${
                generationNotice.includes('Insufficient')
                  ? 'bg-rose-900/90 text-rose-100 border-b border-rose-700'
                  : 'bg-emerald-700/90 text-white border-b border-emerald-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {generationNotice.includes('Insufficient') ? (
                  <AlertCircle className="w-4 h-4 text-rose-300" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{generationNotice}</span>
              </div>
              {generationNotice.includes('Insufficient') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWriteCodeByWatchingAd()}
                    className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold"
                  >
                    Watch Ad (Free)
                  </button>
                  <button
                    onClick={onOpenDailyCredits}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[11px] font-bold"
                  >
                    Daily Missions (+120 CR)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top Options Bar: 2 Options to Write Code */}
          <div
            className={`px-6 py-3.5 border-b flex flex-col md:flex-row items-center justify-between gap-3 ${
              isDarkMode ? 'bg-[#1a1b1f] border-[#292a2f]' : 'bg-blue-50/50 border-blue-100'
            }`}
          >
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 shrink-0">
                <Code2 className="w-4 h-4" />
                <span>Coding Studio Actions:</span>
              </span>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask something to Boss Aura"
                className={`w-full md:w-96 px-3 py-1.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                  isDarkMode
                    ? 'bg-[#141517] border-[#2f3036] text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                }`}
              />
            </div>

            {/* The 2 Primary Required Buttons */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Option 1: Write code by watching ad */}
              <button
                onClick={() => handleWriteCodeByWatchingAd()}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                title="Write code for free by watching a 5-second sponsor ad"
              >
                <Tv className="w-4 h-4 text-yellow-300" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold">Write Code by Watching Ad</span>
                  <span className="text-[10px] text-amber-200 font-normal">Free · 0 Credits</span>
                </div>
              </button>

              {/* Option 2: Write code by 1 credit */}
              <button
                onClick={() => handleWriteCodeByCredit()}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                title={`Write code instantly using 1 credit (Balance: ${credits} CR)`}
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-bold">Write Code by 1 Credit</span>
                  <span className="text-[10px] text-blue-200 font-normal">Instant · 1 Credit</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content Body */}
          {activeTab === 'catalog' ? (
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Column: Language List & Filter */}
              <div
                className={`w-full md:w-80 border-r flex flex-col shrink-0 ${
                  isDarkMode ? 'border-[#292a2e] bg-[#141517]' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                {/* Search & Categories */}
                <div className="p-3 border-b space-y-2 border-gray-500/10">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search languages, frameworks..."
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#1e1f23] border-[#2f3036] text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDarkMode
                            ? 'bg-[#1f2024] hover:bg-[#27282d] text-gray-300'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable Language List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = selectedLanguage.id === lang.id;
                    return (
                      <div
                        key={lang.id}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-[#22242a] border-blue-500/50 shadow-sm'
                              : 'bg-blue-50/70 border-blue-400 shadow-sm'
                            : isDarkMode
                            ? 'border-transparent hover:bg-[#1a1b1f] text-gray-300'
                            : 'border-transparent hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: lang.color }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{lang.name}</span>
                              <span className="text-[10px] font-mono opacity-50 font-normal">
                                {lang.extension}
                              </span>
                            </div>
                            <div className="text-[10px] opacity-60 truncate">
                              {lang.badge}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-gray-500/10 opacity-70 shrink-0">
                          {lang.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Language Details, Sample Code & Prompts */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Language Header Card */}
                <div
                  className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDarkMode ? 'bg-[#1b1c20] border-[#2c2d33]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-4 h-4 rounded-md inline-block shadow-xs"
                        style={{ backgroundColor: selectedLanguage.color }}
                      />
                      <h3 className="text-2xl font-bold">{selectedLanguage.name}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold">
                        {selectedLanguage.extension}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-semibold">
                        {selectedLanguage.category}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 max-w-2xl leading-relaxed">
                      {selectedLanguage.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedLanguage.keyFrameworks.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions for this language */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleWriteCodeByWatchingAd(`Write a production-grade, idiomatic ${selectedLanguage.name} implementation following modern enterprise standards, type safety, and error handling.`)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Write in {selectedLanguage.name} (Watch Ad)</span>
                    </button>
                    <button
                      onClick={() => handleWriteCodeByCredit(`Write a production-grade, idiomatic ${selectedLanguage.name} implementation following modern enterprise standards, type safety, and error handling.`)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Write in {selectedLanguage.name} (1 Credit)</span>
                    </button>
                  </div>
                </div>

                {/* Ready-to-use Prompt Starters with 2 Options */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Curated Production Prompts (Pick to Write Code)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLanguage.promptStarters.map((starter, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isDarkMode
                            ? 'bg-[#191a1d] border-[#292a2f]'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-blue-400 mb-1 flex items-center justify-between">
                            <span>{starter.title}</span>
                          </div>
                          <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed mb-3">
                            {starter.prompt}
                          </p>
                        </div>

                        {/* Inline choices: Ad or 1 Credit */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-500/10">
                          <button
                            onClick={() => handleWriteCodeByWatchingAd(starter.prompt)}
                            className="flex-1 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                            title="Write this prompt by watching an ad"
                          >
                            <Tv className="w-3 h-3" />
                            <span>Watch Ad (Free)</span>
                          </button>
                          <button
                            onClick={() => handleWriteCodeByCredit(starter.prompt)}
                            className="flex-1 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                            title="Write this prompt by spending 1 credit"
                          >
                            <Zap className="w-3 h-3" />
                            <span>1 Credit</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Idiomatic Code Sample */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Idiomatic {selectedLanguage.name} Architecture Sample</span>
                    </h4>
                  </div>
                  <CodeBlock
                    language={selectedLanguage.highlightKey}
                    value={selectedLanguage.sampleCode}
                    isDarkMode={isDarkMode}
                    onOpenSandbox={onOpenSandbox}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'generator' ? (
            /* AI Code Output Tab */
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#1c1d22] border-[#2c2d33]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>BOSS AURA AI Generated Code Output</span>
                  </h3>
                  <p className="text-xs opacity-70">
                    Engineered across {selectedLanguage.name} with production typing, concurrency, and architecture.
                  </p>
                </div>

                {generatedCode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectPrompt(`Regarding this code generated in Coding Studio:\n\n\`\`\`${generatedLanguage}\n${generatedCode}\n\`\`\`\nPlease optimize and analyze this architecture.`);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send to BOSS Chat</span>
                    </button>
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-spin">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold">BOSS AURA AI is writing your code...</div>
                  <p className="text-xs opacity-60 max-w-sm">
                    Synthesizing idiomatic {selectedLanguage.name} code with zero compile errors and full typing.
                  </p>
                </div>
              ) : generatedCode ? (
                <div>
                  <CodeBlock
                    language={generatedLanguage}
                    value={generatedCode}
                    isDarkMode={isDarkMode}
                    onOpenSandbox={onOpenSandbox}
                  />
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 opacity-70">
                  <Code2 className="w-10 h-10 text-gray-500" />
                  <div className="text-sm font-semibold">No code generated yet</div>
                  <p className="text-xs max-w-xs">
                    Choose "Write Code by Watching Ad" (Free) or "Write Code by 1 Credit" above to generate code immediately.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Code Converter / Translator Tab */
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div
                className={`p-5 rounded-3xl border ${
                  isDarkMode ? 'bg-[#1b1c20] border-[#2c2d33]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  <span>Coding Studio Translator & Converter</span>
                </h3>
                <p className="text-xs opacity-75 leading-relaxed">
                  Convert code from one language into another. Choose to convert by watching a free ad or using 1 credit!
                </p>
              </div>

              {/* Language Selector Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">
                    Source Language:
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode
                        ? 'bg-[#1e1f23] border-[#2f3036] text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} ({lang.extension})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">
                    Target Language:
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode
                        ? 'bg-[#1e1f23] border-[#2f3036] text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} ({lang.extension})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code Input Area */}
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Source Code to Translate:
                </label>
                <textarea
                  rows={8}
                  value={converterCode}
                  onChange={(e) => setConverterCode(e.target.value)}
                  placeholder="Paste your source code here..."
                  className={`w-full p-4 font-mono text-xs rounded-2xl border outline-none resize-y ${
                    isDarkMode
                      ? 'bg-[#141517] border-[#2b2c31] text-gray-100 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Submit Buttons with Both Options */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                    isDarkMode
                      ? 'border-[#2d2e33] hover:bg-[#202125]'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleConvertSubmit('ad')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Translate by Watching Ad (Free)</span>
                </button>

                <button
                  onClick={() => handleConvertSubmit('credit')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Translate by 1 Credit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watch Ad Modal */}
      <WatchAdModal
        isOpen={isAdOpen}
        onClose={() => setIsAdOpen(false)}
        onAdCompleted={handleAdFinished}
        isDarkMode={isDarkMode}
        purpose="Write Code for Free"
      />
    </>
  );
};

// Backwards-compatible export
export { CodingStudioModal as PolyglotStudioModal };
