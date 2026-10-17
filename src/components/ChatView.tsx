import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Volume2,
  Mic,
  MicOff,
  Paperclip,
  RotateCcw,
  Bot,
  User as UserIcon,
  Download,
  Image as ImageIcon,
  Code,
  Code2,
  X,
  Plus,
  Search,
  MessageSquare,
  Edit2,
  Zap,
  Coins,
  FolderArchive,
  FileArchive,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { ChatMessage, User, ActiveTab, ChatConversation } from '../types';
import { isGuestUser } from '../lib/credits';
import { CodeBlock } from './CodeBlock';
import { CodingStudioModal } from './CodingStudioModal';
import { CodeSandboxModal } from './CodeSandboxModal';
import { CodeOptionModal } from './CodeOptionModal';
import { WatchAdModal } from './WatchAdModal';
import {
  extractCodeBlocksFromMarkdown,
  downloadMultiFileZip,
  isZipRequestPrompt,
  CodeFile,
} from '../lib/zipExporter';

// Helper to detect if user prompt is asking to write or generate code or a program
export const isCodeWritingPrompt = (text: string): boolean => {
  if (!text || !text.trim()) return false;
  const t = text.trim().toLowerCase();

  // 1. Any prompt asking for / mentioning a program or programming (e.g. "c++ program", "program for fibonacci", "write a program", "give me program", "program to calculate...", "ask program", "simple program", "program of...")
  if (
    /\b(program|programs|programming|programme|programmes)\b/i.test(t) &&
    !/\b(gym|workout|diet|exercise|fitness|tv\s+program|television\s+program)\b/i.test(t)
  ) {
    return true;
  }

  // 2. Any prompt with "code", "coding", "coder"
  if (/\b(code|codes|coding|codebase)\b/i.test(t)) {
    return true;
  }

  // 3. Action verbs asking for code, program, script, function, etc.
  const codePatterns = [
    /\b(write|create|generate|make|build|code|implement|develop|fix|debug|refactor|convert|give|show|provide|need|ask)\s+(me\s+)?(a\s+|an\s+|the\s+|some\s+)?(code|script|program|programme|function|component|app|algorithm|api|class|query|website|page|backend|frontend|server|bot)\b/i,
    /\b(write|create|generate|make|build|code|implement|give|show|need|ask)\s+(in\s+|using\s+|with\s+)?(python|javascript|typescript|java|c\+\+|cpp|c#|csharp|rust|go|golang|php|ruby|html|css|sql|swift|kotlin|react|node|vue|flutter|dart)\b/i,
    /\b(python|javascript|typescript|java|c\+\+|cpp|c#|rust|golang|sql|react|vue|html|css|c)\s+(code|program|script|function|app|project)\b/i,
    /\b(code|program|script)\s+(to|that|for|which|in|of|on|about)\b/i,
    /\bhow\s+to\s+(code|program|build\s+a|create\s+a|write\s+a|implement)\b/i,
    /```/,
    /\bdef\s+[a-zA-Z0-9_]+\s*\(/i,
    /\bfunction\s+[a-zA-Z0-9_]*\s*\(/i,
    /\b#include\s*<[a-zA-Z0-9_.]+>/i,
    /\bpublic\s+class\s+[a-zA-Z0-9_]+/i,
    /\bimport\s+.*\s+from\s+['"]/i,
  ];

  for (const p of codePatterns) {
    if (p.test(t)) return true;
  }

  if ((t.includes('code') || t.includes('program')) && /\b(write|give|create|build|make|generate|provide|show|need|help|ask)\b/i.test(t)) {
    return true;
  }

  return false;
};

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachedImage?: string) => void;
  isLoading: boolean;
  currentUser: User | null;
  setActiveTab?: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  currentConversation?: ChatConversation | null;
  onNewChat?: () => void;
  onOpenFindChat?: () => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  credits?: number;
  onOpenDailyCredits?: () => void;
  onDeductCredit?: (amount?: number) => boolean;
  onOpenAuth?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentUser,
  isDarkMode,
  currentConversation,
  onNewChat,
  onOpenFindChat,
  onRenameConversation,
  credits = 0,
  onOpenDailyCredits,
  onDeductCredit = () => true,
  onOpenAuth,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Polyglot Studio & Sandbox Modals
  const [isPolyglotOpen, setIsPolyglotOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('console.log("Hello from BOSS AURA AI!");');
  const [sandboxLanguage, setSandboxLanguage] = useState('javascript');

  // Code writing option detection state
  const [isCodeOptionOpen, setIsCodeOptionOpen] = useState(false);
  const [pendingCodePrompt, setPendingCodePrompt] = useState('');
  const [pendingCodeImage, setPendingCodeImage] = useState<string | null>(null);
  const [isWatchingAdForCode, setIsWatchingAdForCode] = useState(false);

  // Track ZIP downloading per message ID
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [downloadedZipId, setDownloadedZipId] = useState<string | null>(null);

  const handleDownloadMessageZip = async (msgId: string, files: CodeFile[], customProjectName?: string) => {
    if (downloadingZipId === msgId || files.length === 0) return;
    setDownloadingZipId(msgId);
    try {
      const projName = customProjectName || `boss_aura_${files[0]?.language || 'code'}_project`;
      const ok = await downloadMultiFileZip(files, projName);
      if (ok) {
        setDownloadedZipId(msgId);
        setTimeout(() => setDownloadedZipId(null), 3000);
      }
    } catch (err) {
      console.error('Failed to download message ZIP:', err);
    } finally {
      setDownloadingZipId(null);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const executeSendMessage = (textToSend: string, imageToSend: string | null) => {
    setInput('');
    setAttachedImage(null);
    setAttachedImageName('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend, imageToSend || undefined);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage) || isLoading) return;

    const textToSend = trimmed || (attachedImage ? 'Create a picture inspired by this image like ChatGPT' : '');
    const imageToSend = attachedImage;

    // Check if user is asking to write code:
    if (isCodeWritingPrompt(textToSend)) {
      setPendingCodePrompt(textToSend);
      setPendingCodeImage(imageToSend);
      setIsCodeOptionOpen(true);
      return;
    }

    // Normal non-code prompt: send directly
    executeSendMessage(textToSend, imageToSend);
  };

  // Option 1: Give 1 Credit to write code
  const handleProceedWithCredit = () => {
    if (credits < 1) {
      if (onOpenDailyCredits) onOpenDailyCredits();
      return;
    }
    if (onDeductCredit) {
      const ok = onDeductCredit(1);
      if (!ok) return;
    }
    const text = pendingCodePrompt;
    const img = pendingCodeImage;
    setIsCodeOptionOpen(false);
    setPendingCodePrompt('');
    setPendingCodeImage(null);
    executeSendMessage(text, img);
  };

  // Option 2: Watch Ad to write code
  const handleProceedWithWatchAd = () => {
    setIsCodeOptionOpen(false);
    setIsWatchingAdForCode(true);
  };

  // Ad completed -> Generate code without spending credits
  const handleCodeAdCompleted = () => {
    setIsWatchingAdForCode(false);
    const text = pendingCodePrompt;
    const img = pendingCodeImage;
    setPendingCodePrompt('');
    setPendingCodeImage(null);
    executeSendMessage(text, img);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Copy text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-to-speech speaker
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Web Speech API speech recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Download image helper
  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename.slice(0, 30).replace(/\s+/g, '_')}_boss_ai.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Top Conversation Header with New Chat, Find Old Chat & Polyglot Studio */}
      <div
        id="chat-top-bar"
        className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 z-10 transition-colors ${
          isDarkMode
            ? 'bg-[#18191b]/95 border-[#28292c] backdrop-blur-md'
            : 'bg-white/90 border-gray-200/90 backdrop-blur-md'
        }`}
      >
        {/* Current Conversation title & rename */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>

          {isEditingTitle && currentConversation ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (tempTitle.trim() && onRenameConversation) {
                      onRenameConversation(currentConversation.id, tempTitle.trim());
                    }
                    setIsEditingTitle(false);
                  }
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className={`px-2 py-0.5 text-xs rounded border outline-none ${
                  isDarkMode
                    ? 'bg-[#292a2e] border-blue-500 text-white'
                    : 'bg-white border-blue-500 text-gray-900'
                }`}
              />
              <button
                onClick={() => {
                  if (tempTitle.trim() && onRenameConversation && currentConversation) {
                    onRenameConversation(currentConversation.id, tempTitle.trim());
                  }
                  setIsEditingTitle(false);
                }}
                className="p-1 text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-gray-400 hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {currentConversation?.title || (messages.length > 0 ? 'Conversation' : 'New Chat')}
              </span>
              {currentUser?.email && (
                <span
                  className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 max-w-[160px] truncate"
                  title={`Chat partitioned strictly for ${currentUser.email}`}
                >
                  {currentUser.email}
                </span>
              )}
              {currentConversation && onRenameConversation && (
                <button
                  onClick={() => {
                    setTempTitle(currentConversation.title);
                    setIsEditingTitle(true);
                  }}
                  className="p-1 opacity-50 hover:opacity-100 hover:text-blue-400 transition-opacity"
                  title="Rename chat"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action buttons: Daily Credit, Coding Studio, Find Old Chats & New Chat */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Daily Credit quick button in Chat top bar */}
          {onOpenDailyCredits && (
            <button
              onClick={onOpenDailyCredits}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isDarkMode
                  ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-300 shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 shadow-xs'
              }`}
              title="Daily Credit Missions (10-120 Credits/Day)"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Daily Credit</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                {credits} CR
              </span>
            </button>
          )}

          {/* Coding Studio Button */}
          <button
            onClick={() => setIsPolyglotOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-950/60 to-indigo-950/60 hover:from-blue-900/60 hover:to-indigo-900/60 border-blue-500/40 text-blue-300 shadow-sm'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-xs'
            }`}
            title="Open Coding Studio (Watch Ad or 1 Credit)"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xs:inline">Coding Studio</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/20 text-blue-300 font-mono font-bold">
              Ad / 1 CR
            </span>
          </button>

          {onOpenFindChat && (
            <button
              id="topbar-find-chat-btn"
              onClick={onOpenFindChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isDarkMode
                  ? 'bg-[#232427] hover:bg-[#2c2d31] border-[#343639] text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300/80 text-gray-700'
              }`}
              title="Search and find old conversations like ChatGPT"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Find Old Chats</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] font-mono opacity-60">⌘K</kbd>
            </button>
          )}

          {onNewChat && (
            <button
              id="topbar-new-chat-btn"
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm transition-all"
              title="Start a new chat conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Screen if empty - Clean Search Engine Hero */}
          {messages.length === 0 ? (
            <div className="pt-24 pb-16 flex flex-col items-center justify-center text-center animate-fadeIn select-none">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#1a73e8] via-[#8e24aa] to-[#d93025] p-[2px] shadow-lg mb-6">
                <div
                  className={`w-full h-full rounded-[22px] flex items-center justify-center ${
                    isDarkMode ? 'bg-[#1e1f20]' : 'bg-white'
                  }`}
                >
                  <Sparkles className="w-8 h-8 text-[#4285f4] animate-pulse" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight mb-2">
                <span className={isDarkMode ? 'gemini-gradient-text-dark' : 'gemini-gradient-text'}>
                  Ask something to Boss Aura
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mt-1 mb-4 leading-relaxed">
                Universal Software Architect for <span className="text-blue-400 font-semibold">all coding languages</span>. Direct, accurate, and strictly relevant answers.
              </p>

              {/* Quick Polyglot Language Starters */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mb-4 px-2">
                {[
                  { name: 'Python', prompt: 'Write an optimized Python 3.12 script with type hints: ' },
                  { name: 'TypeScript', prompt: 'Write a type-safe TypeScript implementation: ' },
                  { name: 'JavaScript', prompt: 'Write a modern modern ES2024 JavaScript solution: ' },
                  { name: 'C++', prompt: 'Write a high-performance modern C++20 program: ' },
                  { name: 'Java', prompt: 'Write a clean, production-grade Java 21 implementation: ' },
                  { name: 'Rust', prompt: 'Write an idiomatic Rust program with error handling: ' },
                  { name: 'Go', prompt: 'Write a concurrent Go (Golang) microservice: ' },
                  { name: 'HTML & CSS', prompt: 'Write a modern responsive HTML5 & CSS3 layout: ' },
                  { name: 'C#', prompt: 'Write a modern C# .NET solution: ' },
                  { name: 'SQL', prompt: 'Write an optimized SQL query with indexes: ' },
                  { name: 'Bash', prompt: 'Write a robust Bash shell automation script: ' },
                  { name: 'Assembly', prompt: 'Write an optimized x86-64 assembly routine: ' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setInput(item.prompt);
                      textareaRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:scale-105 border ${
                      isDarkMode
                        ? 'bg-[#1e1f20] hover:bg-[#28292a] border-[#37393b] text-gray-300 hover:text-white hover:border-blue-500/50'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-400'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Device Aspect Ratio Standards Indicator */}
              <div
                className={`mb-4 px-3.5 py-2 rounded-2xl border text-xs max-w-lg w-full flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs transition-colors ${
                  isDarkMode
                    ? 'bg-[#1b1c20]/80 border-[#2f3138] text-gray-300'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-blue-400">Device Screen Standards:</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span title="Desktop & Laptops: 16:10 or 3:2" className="text-blue-400 font-bold">16:10 / 3:2</span>
                  <span className="opacity-40">·</span>
                  <span title="Tablets / iPads: 4:3 or 16:10" className="text-purple-400 font-bold">4:3 / 16:10</span>
                  <span className="opacity-40">·</span>
                  <span title="Mobile Phones: 19.5:9 or 18:9" className="text-emerald-400 font-bold">19.5:9 / 18:9</span>
                </div>
              </div>

              {isGuestUser(currentUser) && (
                <div className="mt-1 flex items-center justify-center gap-2 animate-fadeIn">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>Guest Mode: Chats are not saved</span>
                  </span>
                  {onOpenAuth && (
                    <button
                      onClick={onOpenAuth}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
                    >
                      Log in to save chats
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Message List */
            <div className="space-y-6 pt-4 pb-20">
              {messages.map((msg, msgIndex) => {
                const directFiles = extractCodeBlocksFromMarkdown(msg.content);
                const prevUserMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
                const userAskedZip = Boolean(prevUserMsg && prevUserMsg.role === 'user' && isZipRequestPrompt(prevUserMsg.content));
                let msgFiles = directFiles;
                if (msgFiles.length === 0 && userAskedZip) {
                  for (let pi = msgIndex - 1; pi >= 0; pi--) {
                    if (messages[pi].role !== 'user') {
                      const found = extractCodeBlocksFromMarkdown(messages[pi].content);
                      if (found.length > 0) {
                        msgFiles = found;
                        break;
                      }
                    }
                  }
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-[#8e24aa] p-[1.5px] shrink-0 mt-1 shadow-sm">
                      <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDarkMode ? 'bg-[#1e1f20]' : 'bg-white'}`}>
                        <Sparkles className="w-4 h-4 text-[#4285f4]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? isDarkMode
                          ? 'bg-[#2b394f] text-white rounded-br-sm'
                          : 'bg-[#e8f0fe] text-gray-900 rounded-br-sm'
                        : isDarkMode
                        ? 'bg-[#1e1f20] border border-[#2e2f33] text-gray-100 rounded-bl-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {/* Header for assistant message */}
                    {msg.role !== 'user' && (
                      <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-gray-500/10 text-xs">
                        <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          {msg.modelUsed || 'BOSS AURA AI (Polyglot Architect)'}
                        </span>
                        <span className="text-[10px] opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* If user attached an image */}
                    {msg.role === 'user' && msg.attachedImage && (
                      <div className="mb-2 rounded-2xl overflow-hidden border border-white/20 max-w-[280px]">
                        <img
                          src={msg.attachedImage}
                          alt="Attached gallery photo"
                          className="w-full h-auto max-h-52 object-cover"
                        />
                        <div className="px-2.5 py-1 bg-black/60 text-[10px] font-semibold text-emerald-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 text-emerald-400" />
                          <span>Photo from Gallery</span>
                        </div>
                      </div>
                    )}

                    {/* Content Markdown with Syntax Highlighted Code Blocks */}
                    <div className="markdown-body prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            if (match) {
                              return (
                                <CodeBlock
                                  language={match[1]}
                                  value={codeString}
                                  isDarkMode={isDarkMode}
                                  onOpenSandbox={(codeToRun, langToRun) => {
                                    setSandboxCode(codeToRun);
                                    setSandboxLanguage(langToRun);
                                    setIsSandboxOpen(true);
                                  }}
                                />
                              );
                            }
                            return (
                              <code
                                className={`${className || ''} px-1.5 py-0.5 rounded font-mono text-xs ${
                                  isDarkMode ? 'bg-[#292a2e] text-blue-300' : 'bg-gray-100 text-blue-700'
                                }`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Project ZIP Download Card */}
                    {msg.role !== 'user' && msgFiles.length > 0 && (
                      <div
                        id={`zip-download-card-${msg.id}`}
                        className={`mt-3.5 p-3.5 rounded-2xl border transition-all ${
                          userAskedZip
                            ? isDarkMode
                              ? 'bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/80 border-blue-500/60 shadow-lg ring-1 ring-blue-500/40'
                              : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-400 shadow-md ring-1 ring-blue-400/40'
                            : isDarkMode
                            ? 'bg-[#18191d] border-[#2c2d33]'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
                              <FolderArchive className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs">
                                  {userAskedZip ? '📦 Requested Code ZIP Package Ready' : '📦 Project Code Package (.zip)'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  {msgFiles.length} file{msgFiles.length > 1 ? 's' : ''} + README.md
                                </span>
                                {userAskedZip && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                                    Ready to Download
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] opacity-75 mt-0.5">
                                Download this complete code project as a ready-to-run <strong className="text-blue-400">.zip</strong> archive with step-by-step VS Code execution instructions.
                              </p>
                              {/* List of files in zip */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                {msgFiles.map((f, i) => (
                                  <span
                                    key={i}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                      isDarkMode
                                        ? 'bg-black/30 border-gray-700 text-gray-300'
                                        : 'bg-white border-gray-300 text-gray-700 shadow-xs'
                                    }`}
                                  >
                                    <FileArchive className="w-3 h-3 text-blue-400" />
                                    <span>{f.filename}</span>
                                  </span>
                                ))}
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                    isDarkMode
                                      ? 'bg-black/30 border-gray-700 text-emerald-400'
                                      : 'bg-white border-gray-300 text-emerald-700 shadow-xs'
                                  }`}
                                >
                                  <span>README.md (VS Code Guide)</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDownloadMessageZip(msg.id, msgFiles)}
                            disabled={downloadingZipId === msg.id}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-md hover:scale-105 cursor-pointer ${
                              downloadedZipId === msg.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white'
                            }`}
                            title="Download project as .zip file"
                          >
                            {downloadingZipId === msg.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating ZIP...</span>
                              </>
                            ) : downloadedZipId === msg.id ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>ZIP Downloaded! 📦</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Download Project (.zip)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons for assistant message */}
                    {msg.role !== 'user' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-500/10 text-xs opacity-75">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-500/10 transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-[11px] text-green-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-500/10 transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Listen</span>
                        </button>

                        {msgFiles.length > 0 && (
                          <button
                            onClick={() => handleDownloadMessageZip(msg.id, msgFiles)}
                            disabled={downloadingZipId === msg.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors"
                            title="Download complete code as .zip archive"
                          >
                            {downloadingZipId === msg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : downloadedZipId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <FolderArchive className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px] font-medium">
                              {downloadedZipId === msg.id ? 'ZIP Saved' : 'Download ZIP'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-sm mt-1">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt="User"
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1a73e8] to-[#8e24aa] p-[1.5px] shrink-0 mt-1 shadow-sm">
                    <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDarkMode ? 'bg-[#1e1f20]' : 'bg-white'}`}>
                      <Sparkles className="w-4 h-4 text-[#4285f4] animate-spin" />
                    </div>
                  </div>
                  <div className={`p-4 rounded-3xl text-sm flex items-center gap-3 ${
                    isDarkMode ? 'bg-[#1e1f20] text-gray-300' : 'bg-white text-gray-700'
                  }`}>
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                    </div>
                    <span className="text-xs opacity-75 font-medium">
                      Boss AI is generating your response...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Gemini-style Input Box */}
      <div className={`p-4 border-t ${isDarkMode ? 'bg-[#131314]/95 border-[#2e2f33]' : 'bg-white/95 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Hidden File Input for Gallery / Device Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <form
            onSubmit={handleSubmit}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-3xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/40 ${
              isDragging
                ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500'
                : isDarkMode
                ? 'bg-[#1e1f20] border-[#37393b]'
                : 'bg-[#f0f4f9] border-gray-300'
            }`}
          >
            {/* Attached Reference Image Preview Bar */}
            {attachedImage && (
              <div className="mx-3 mt-3 p-2 rounded-2xl bg-black/40 border border-blue-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={attachedImage}
                    alt="Gallery attachment"
                    className="w-10 h-10 rounded-xl object-cover border border-blue-500/40 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Code Screenshot or Diagram Attached</span>
                    </span>
                    <span className="text-[11px] opacity-70 truncate max-w-[280px]">
                      {attachedImageName || 'Ready for visual inspection'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null);
                    setAttachedImageName('');
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Remove attached photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="gemini-chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask something to Boss Aura"
              rows={1}
              className={`w-full px-5 pt-3.5 pb-12 rounded-3xl resize-none bg-transparent outline-none text-base sm:text-sm placeholder:opacity-50 leading-relaxed ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            />

            {/* Action buttons inside input box */}
            <div className="absolute left-3 bottom-2.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${
                  attachedImage
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'hover:bg-gray-500/10 text-gray-400 hover:text-emerald-400'
                }`}
                title="Attach code screenshot, architecture diagram, or error log"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'hover:bg-gray-500/10 text-gray-400 hover:text-gray-200'
                }`}
                title={isListening ? 'Stop listening' : 'Voice dictation'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPolyglotOpen(true)}
                className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  isDarkMode
                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
                title="Write Code or Program: Watch Ad or 1 Credit"
              >
                <Code2 className="w-3 h-3 text-blue-400" />
                <span>Code / Program</span>
                <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-blue-500/20 text-blue-300">
                  Ad / 1 CR
                </span>
              </button>
              <button
                type="submit"
                id="send-message-btn"
                disabled={(!input.trim() && !attachedImage) || isLoading}
                className={`p-2 rounded-full transition-all ${
                  (input.trim() || attachedImage) && !isLoading
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm scale-105'
                    : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lightbox for Image Preview */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImagePreview}
              alt="Expanded preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-xs font-semibold"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}

      {/* Code Option Modal (Give 1 Credit or Watch Ad for Writing Code) */}
      <CodeOptionModal
        isOpen={isCodeOptionOpen}
        onClose={() => setIsCodeOptionOpen(false)}
        promptText={pendingCodePrompt}
        credits={credits}
        onChooseCredit={handleProceedWithCredit}
        onChooseWatchAd={handleProceedWithWatchAd}
        onOpenDailyCredits={onOpenDailyCredits}
        isDarkMode={isDarkMode}
      />

      {/* Watch Ad Modal for Free Code / Program Generation */}
      <WatchAdModal
        isOpen={isWatchingAdForCode}
        onClose={() => setIsWatchingAdForCode(false)}
        onAdCompleted={handleCodeAdCompleted}
        isDarkMode={isDarkMode}
        purpose={
          pendingCodePrompt.toLowerCase().includes('program')
            ? 'Write Program with BOSS AURA AI'
            : 'Write Code with BOSS AURA AI'
        }
      />

      {/* Coding Studio Modal */}
      <CodingStudioModal
        isOpen={isPolyglotOpen}
        onClose={() => setIsPolyglotOpen(false)}
        onSelectPrompt={(p) => {
          onSendMessage(p);
        }}
        isDarkMode={isDarkMode}
        onOpenSandbox={(c, l) => {
          setSandboxCode(c);
          setSandboxLanguage(l);
          setIsSandboxOpen(true);
        }}
        credits={credits}
        onDeductCredit={onDeductCredit}
        onOpenDailyCredits={onOpenDailyCredits}
      />

      {/* Interactive Code Sandbox Modal */}
      <CodeSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        initialCode={sandboxCode}
        initialLanguage={sandboxLanguage}
        isDarkMode={isDarkMode}
        onAskBossAiToFix={(brokenCode, errorMsg) => {
          onSendMessage(`Please fix this runtime error in my ${sandboxLanguage.toUpperCase()} code:\n\nError: ${errorMsg}\n\nCode:\n\`\`\`${sandboxLanguage}\n${brokenCode}\n\`\`\``);
        }}
      />
    </div>
  );
};
