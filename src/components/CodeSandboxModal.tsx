import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Zap,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode: string;
  initialLanguage: string;
  isDarkMode: boolean;
  onAskBossAiToFix?: (code: string, errorMsg: string) => void;
}

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  initialLanguage,
  isDarkMode,
  onAskBossAiToFix,
}) => {
  const [code, setCode] = useState(initialCode);
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'console' | 'preview'>('console');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setCode(initialCode);
    setOutputLogs([]);
    setExecutionError(null);
    setExecutionTime(null);
  }, [initialCode]);

  if (!isOpen) return null;

  const isHtml = ['html', 'markup'].includes(initialLanguage.toLowerCase());

  const runCode = () => {
    setIsRunning(true);
    setExecutionError(null);
    setOutputLogs([]);
    const startTime = performance.now();

    const cleanLang = initialLanguage.toLowerCase();

    if (cleanLang === 'html' || cleanLang === 'markup') {
      setViewMode('preview');
      if (iframeRef.current) {
        iframeRef.current.srcdoc = code;
      }
      setExecutionTime(Math.round(performance.now() - startTime));
      setIsRunning(false);
      return;
    }

    // JavaScript / TypeScript execution via safe Function sandbox
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(
            args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
          );
        },
        info: (...args: any[]) => {
          logs.push('[INFO] ' + args.map(String).join(' '));
        },
        warn: (...args: any[]) => {
          logs.push('[WARN] ' + args.map(String).join(' '));
        },
        error: (...args: any[]) => {
          logs.push('[ERROR] ' + args.map(String).join(' '));
        },
      };

      // Strip basic TypeScript types for client execution if needed
      let executableJs = code;
      // Remove type annotations like `: string`, `: number`, `interface ...`, etc.
      executableJs = executableJs
        .replace(/:\s*[A-Za-z0-9_<>\[\]|]+/g, '')
        .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
        .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '');

      // Execute inside Function wrapper
      const runFn = new Function('console', executableJs);
      const returnedValue = runFn(customConsole);

      if (returnedValue !== undefined) {
        logs.push(`=> Returned: ${typeof returnedValue === 'object' ? JSON.stringify(returnedValue, null, 2) : String(returnedValue)}`);
      }

      if (logs.length === 0) {
        logs.push('Execution completed successfully with no console output.');
      }

      setOutputLogs(logs);
      setExecutionTime(Math.round(performance.now() - startTime));
    } catch (err: any) {
      setExecutionError(err?.message || String(err));
      setExecutionTime(Math.round(performance.now() - startTime));
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[2px] shadow-sm">
              <div
                className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                  isDarkMode ? 'bg-[#18191c]' : 'bg-white'
                }`}
              >
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Interactive Code Sandbox</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {initialLanguage.toUpperCase()}
                </span>
              </div>
              <p className="text-xs opacity-65">
                Edit and test code in real-time with instant execution and error inspection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode ? 'hover:bg-[#25262a] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sandbox Body: Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Editor */}
          <div
            className={`w-full md:w-1/2 border-r flex flex-col ${
              isDarkMode ? 'border-[#292a2e] bg-[#131416]' : 'border-gray-200 bg-white'
            }`}
          >
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono select-none ${
                isDarkMode ? 'border-[#292a2e] bg-[#18191c]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className="opacity-70">Source Editor</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1 opacity-70 hover:opacity-100 transition-opacity"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-xs outline-none resize-none leading-relaxed bg-transparent"
              spellCheck={false}
            />
          </div>

          {/* Right Output / Console */}
          <div
            className={`w-full md:w-1/2 flex flex-col ${
              isDarkMode ? 'bg-[#161719]' : 'bg-gray-50/50'
            }`}
          >
            {/* Output Header */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono select-none ${
                isDarkMode ? 'border-[#292a2e] bg-[#18191c]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="opacity-70">Console Output</span>
                {executionTime !== null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-500/10 opacity-70 flex items-center gap-1 font-sans">
                    <Clock className="w-3 h-3" />
                    <span>{executionTime}ms</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isHtml && (
                  <button
                    onClick={() => setViewMode(viewMode === 'console' ? 'preview' : 'console')}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-sans"
                  >
                    Switch to {viewMode === 'console' ? 'Preview' : 'Logs'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setOutputLogs([]);
                    setExecutionError(null);
                  }}
                  className="p-1 opacity-70 hover:opacity-100 transition-opacity"
                  title="Clear Console"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Output Display */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-2">
              {viewMode === 'preview' && isHtml ? (
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0 rounded-xl bg-white"
                  title="HTML Preview"
                />
              ) : (
                <>
                  {outputLogs.length === 0 && !executionError && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center py-12">
                      <Terminal className="w-8 h-8 mb-2" />
                      <p>Click "Run Code" above to execute this script.</p>
                    </div>
                  )}

                  {outputLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-[#1b1c20] text-emerald-400' : 'bg-white border text-emerald-700'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-mono text-xs">{log}</pre>
                    </div>
                  ))}

                  {executionError && (
                    <div
                      className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isDarkMode
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Runtime Exception:</span>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap font-mono opacity-90 pl-6">
                        {executionError}
                      </pre>

                      {onAskBossAiToFix && (
                        <button
                          onClick={() => {
                            onAskBossAiToFix(code, executionError);
                            onClose();
                          }}
                          className="mt-2 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ask BOSS AURA AI to Fix Error</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
