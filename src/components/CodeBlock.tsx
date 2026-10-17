import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Play,
  Maximize2,
  Minimize2,
  FileCode,
  Terminal,
  Code2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Laptop,
  FolderArchive,
  Loader2,
} from 'lucide-react';
import Prism from 'prismjs';
import { downloadCodeAsZip } from '../lib/zipExporter';

// Basic Prism grammar imports (Prism bundle in browser)
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-solidity';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

interface CodeBlockProps {
  language?: string;
  value: string;
  isDarkMode?: boolean;
  onOpenSandbox?: (code: string, language: string) => void;
}

interface LanguageMeta {
  name: string;
  ext: string;
  color: string;
  iconLabel: string;
  ide: string;
  vscodeExt: string;
  runCommand: string;
}

const LANGUAGE_METADATA: Record<string, LanguageMeta> = {
  javascript: {
    name: 'JavaScript',
    ext: '.js',
    color: '#f7df1e',
    iconLabel: 'JS',
    ide: 'VS Code, Web Browser, Node.js',
    vscodeExt: 'JavaScript and TypeScript (Built-in) / ESLint',
    runCommand: 'node app.js',
  },
  js: {
    name: 'JavaScript',
    ext: '.js',
    color: '#f7df1e',
    iconLabel: 'JS',
    ide: 'VS Code, Web Browser, Node.js',
    vscodeExt: 'JavaScript and TypeScript (Built-in) / ESLint',
    runCommand: 'node app.js',
  },
  typescript: {
    name: 'TypeScript',
    ext: '.ts',
    color: '#3178c6',
    iconLabel: 'TS',
    ide: 'VS Code, Node.js / ts-node, WebStorm',
    vscodeExt: 'TypeScript and JavaScript Language Features',
    runCommand: 'npx tsx app.ts',
  },
  ts: {
    name: 'TypeScript',
    ext: '.ts',
    color: '#3178c6',
    iconLabel: 'TS',
    ide: 'VS Code, Node.js / ts-node, WebStorm',
    vscodeExt: 'TypeScript and JavaScript Language Features',
    runCommand: 'npx tsx app.ts',
  },
  tsx: {
    name: 'TypeScript React',
    ext: '.tsx',
    color: '#3178c6',
    iconLabel: 'TSX',
    ide: 'VS Code (Vite / Next.js project)',
    vscodeExt: 'ES7+ React/Redux/React-Native snippets',
    runCommand: 'npm run dev',
  },
  jsx: {
    name: 'JavaScript React',
    ext: '.jsx',
    color: '#f7df1e',
    iconLabel: 'JSX',
    ide: 'VS Code (Vite / React project)',
    vscodeExt: 'ES7+ React/Redux/React-Native snippets',
    runCommand: 'npm run dev',
  },
  python: {
    name: 'Python',
    ext: '.py',
    color: '#3776ab',
    iconLabel: 'PY',
    ide: 'VS Code, PyCharm, Jupyter Notebook',
    vscodeExt: 'Python (by Microsoft)',
    runCommand: 'python main.py',
  },
  py: {
    name: 'Python',
    ext: '.py',
    color: '#3776ab',
    iconLabel: 'PY',
    ide: 'VS Code, PyCharm, Jupyter Notebook',
    vscodeExt: 'Python (by Microsoft)',
    runCommand: 'python main.py',
  },
  rust: {
    name: 'Rust',
    ext: '.rs',
    color: '#dea584',
    iconLabel: 'RS',
    ide: 'VS Code, RustRover, CLion',
    vscodeExt: 'rust-analyzer',
    runCommand: 'cargo run',
  },
  rs: {
    name: 'Rust',
    ext: '.rs',
    color: '#dea584',
    iconLabel: 'RS',
    ide: 'VS Code, RustRover, CLion',
    vscodeExt: 'rust-analyzer',
    runCommand: 'cargo run',
  },
  go: {
    name: 'Go (Golang)',
    ext: '.go',
    color: '#00add8',
    iconLabel: 'GO',
    ide: 'VS Code, GoLand',
    vscodeExt: 'Go (by Go Team at Google)',
    runCommand: 'go run main.go',
  },
  golang: {
    name: 'Go (Golang)',
    ext: '.go',
    color: '#00add8',
    iconLabel: 'GO',
    ide: 'VS Code, GoLand',
    vscodeExt: 'Go (by Go Team at Google)',
    runCommand: 'go run main.go',
  },
  cpp: {
    name: 'C++',
    ext: '.cpp',
    color: '#f34b7d',
    iconLabel: 'C++',
    ide: 'VS Code, CLion, Visual Studio',
    vscodeExt: 'C/C++ (by Microsoft)',
    runCommand: 'g++ -std=c++17 main.cpp -o main && ./main',
  },
  'c++': {
    name: 'C++',
    ext: '.cpp',
    color: '#f34b7d',
    iconLabel: 'C++',
    ide: 'VS Code, CLion, Visual Studio',
    vscodeExt: 'C/C++ (by Microsoft)',
    runCommand: 'g++ -std=c++17 main.cpp -o main && ./main',
  },
  c: {
    name: 'C',
    ext: '.c',
    color: '#555555',
    iconLabel: 'C',
    ide: 'VS Code, CLion, Code::Blocks',
    vscodeExt: 'C/C++ (by Microsoft)',
    runCommand: 'gcc main.c -o main && ./main',
  },
  csharp: {
    name: 'C#',
    ext: '.cs',
    color: '#178600',
    iconLabel: 'C#',
    ide: 'VS Code, Visual Studio 2022, Rider',
    vscodeExt: 'C# Dev Kit (by Microsoft)',
    runCommand: 'dotnet run',
  },
  cs: {
    name: 'C#',
    ext: '.cs',
    color: '#178600',
    iconLabel: 'C#',
    ide: 'VS Code, Visual Studio 2022, Rider',
    vscodeExt: 'C# Dev Kit (by Microsoft)',
    runCommand: 'dotnet run',
  },
  java: {
    name: 'Java',
    ext: '.java',
    color: '#b07219',
    iconLabel: 'JAVA',
    ide: 'VS Code, IntelliJ IDEA, Eclipse',
    vscodeExt: 'Extension Pack for Java (by Microsoft)',
    runCommand: 'javac Main.java && java Main',
  },
  kotlin: {
    name: 'Kotlin',
    ext: '.kt',
    color: '#a97bff',
    iconLabel: 'KT',
    ide: 'VS Code, IntelliJ IDEA, Android Studio',
    vscodeExt: 'Kotlin (by fwcd)',
    runCommand: 'kotlinc main.kt -include-runtime -d main.jar && java -jar main.jar',
  },
  kt: {
    name: 'Kotlin',
    ext: '.kt',
    color: '#a97bff',
    iconLabel: 'KT',
    ide: 'VS Code, IntelliJ IDEA, Android Studio',
    vscodeExt: 'Kotlin (by fwcd)',
    runCommand: 'kotlinc main.kt -include-runtime -d main.jar && java -jar main.jar',
  },
  swift: {
    name: 'Swift',
    ext: '.swift',
    color: '#f05138',
    iconLabel: 'SWIFT',
    ide: 'VS Code, Xcode (macOS)',
    vscodeExt: 'Swift (by Swift Server Workgroup)',
    runCommand: 'swift main.swift',
  },
  dart: {
    name: 'Dart',
    ext: '.dart',
    color: '#00b4ab',
    iconLabel: 'DART',
    ide: 'VS Code, Android Studio',
    vscodeExt: 'Dart / Flutter (by Dart Code)',
    runCommand: 'dart run main.dart',
  },
  php: {
    name: 'PHP',
    ext: '.php',
    color: '#4f5d95',
    iconLabel: 'PHP',
    ide: 'VS Code, PhpStorm',
    vscodeExt: 'PHP Intelephense',
    runCommand: 'php script.php',
  },
  ruby: {
    name: 'Ruby',
    ext: '.rb',
    color: '#701516',
    iconLabel: 'RB',
    ide: 'VS Code, RubyMine',
    vscodeExt: 'Ruby LSP (by Shopify)',
    runCommand: 'ruby script.rb',
  },
  rb: {
    name: 'Ruby',
    ext: '.rb',
    color: '#701516',
    iconLabel: 'RB',
    ide: 'VS Code, RubyMine',
    vscodeExt: 'Ruby LSP (by Shopify)',
    runCommand: 'ruby script.rb',
  },
  sql: {
    name: 'SQL',
    ext: '.sql',
    color: '#e38c00',
    iconLabel: 'SQL',
    ide: 'VS Code (SQLTools), DBeaver, DataGrip',
    vscodeExt: 'SQLTools (by Matheus Teixeira)',
    runCommand: 'psql / mysql -u root -p < script.sql',
  },
  postgresql: {
    name: 'PostgreSQL',
    ext: '.sql',
    color: '#336791',
    iconLabel: 'PG',
    ide: 'VS Code (PostgreSQL extension), pgAdmin 4',
    vscodeExt: 'PostgreSQL (by Chris Kolkman)',
    runCommand: 'psql -d mydatabase -f script.sql',
  },
  bash: {
    name: 'Bash / Shell',
    ext: '.sh',
    color: '#89e051',
    iconLabel: 'SH',
    ide: 'VS Code Terminal, Linux/macOS Bash, Git Bash',
    vscodeExt: 'Bash IDE / ShellCheck',
    runCommand: 'bash script.sh',
  },
  sh: {
    name: 'Shell',
    ext: '.sh',
    color: '#89e051',
    iconLabel: 'SH',
    ide: 'VS Code Terminal, Linux/macOS Bash, Git Bash',
    vscodeExt: 'Bash IDE / ShellCheck',
    runCommand: 'bash script.sh',
  },
  html: {
    name: 'HTML5',
    ext: '.html',
    color: '#e34f26',
    iconLabel: 'HTML',
    ide: 'VS Code, Chrome / Firefox / Edge',
    vscodeExt: 'Live Server (by Ritwick Dey)',
    runCommand: 'Right-click index.html -> Open with Live Server',
  },
  css: {
    name: 'CSS3',
    ext: '.css',
    color: '#1572b6',
    iconLabel: 'CSS',
    ide: 'VS Code, Web Browser',
    vscodeExt: 'Tailwind CSS IntelliSense / Prettier',
    runCommand: 'Linked via <link rel="stylesheet" href="style.css"> in HTML',
  },
  json: {
    name: 'JSON',
    ext: '.json',
    color: '#cbcb41',
    iconLabel: 'JSON',
    ide: 'VS Code (Built-in JSON validation)',
    vscodeExt: 'Prettier - Code formatter',
    runCommand: 'Parsed via JSON.parse() or config file',
  },
  yaml: {
    name: 'YAML',
    ext: '.yaml',
    color: '#cb171e',
    iconLabel: 'YAML',
    ide: 'VS Code, PyCharm, Docker / K8s',
    vscodeExt: 'YAML (by Red Hat)',
    runCommand: 'Config file for Docker, GitHub Actions, or Kubernetes',
  },
  solidity: {
    name: 'Solidity',
    ext: '.sol',
    color: '#aa6746',
    iconLabel: 'SOL',
    ide: 'VS Code, Remix IDE (Ethereum)',
    vscodeExt: 'Solidity (by Juan Blanco)',
    runCommand: 'npx hardhat compile / remix.ethereum.org',
  },
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = 'text',
  value,
  isDarkMode = true,
  onOpenSandbox,
}) => {
  const [copied, setCopied] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVscodeGuide, setShowVscodeGuide] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);

  const cleanLang = (language || 'text').toLowerCase().trim();
  const meta: LanguageMeta = LANGUAGE_METADATA[cleanLang] || {
    name: cleanLang ? cleanLang.toUpperCase() : 'CODE',
    ext: '.txt',
    color: '#6366f1',
    iconLabel: (cleanLang ? cleanLang.slice(0, 4) : 'TXT').toUpperCase(),
    ide: 'VS Code (Visual Studio Code)',
    vscodeExt: 'Language Support Extension',
    runCommand: `Open and run in VS Code`,
  };

  const isRunnable = ['javascript', 'js', 'html', 'typescript', 'ts'].includes(cleanLang);

  useEffect(() => {
    try {
      const prismLang = Prism.languages[cleanLang] || Prism.languages.javascript || Prism.languages.clike;
      if (prismLang) {
        const html = Prism.highlight(value, prismLang, cleanLang);
        setHighlightedHtml(html);
      } else {
        setHighlightedHtml('');
      }
    } catch (e) {
      setHighlightedHtml('');
    }
  }, [value, cleanLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(meta.runCommand);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `boss_aura_ai_code_${Date.now()}${meta.ext}`;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const success = await downloadCodeAsZip({
        code: value,
        language: cleanLang,
        projectName: `boss_aura_${cleanLang}_project`,
      });
      if (success) {
        setZipDownloaded(true);
        setTimeout(() => setZipDownloaded(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  const lines = value.split('\n');

  return (
    <div
      className={`my-4 rounded-2xl overflow-hidden border transition-all ${
        isDarkMode
          ? 'bg-[#141517] border-[#2a2b2f] text-gray-100 shadow-xl'
          : 'bg-[#f8f9fa] border-gray-200 text-gray-900 shadow-md'
      } ${isExpanded ? 'fixed inset-4 z-50 overflow-auto my-0' : ''}`}
    >
      {/* Header Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b text-xs font-mono select-none ${
          isDarkMode ? 'bg-[#1b1c20] border-[#2a2b2f]' : 'bg-[#edf2f7] border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Language Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase text-white shadow-sm"
            style={{ backgroundColor: meta.color }}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{meta.name}</span>
          </div>

          <span className="text-[11px] opacity-60">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* VS Code & IDE Guide Toggle */}
          <button
            onClick={() => setShowVscodeGuide(!showVscodeGuide)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
              showVscodeGuide
                ? 'bg-blue-600 text-white shadow-sm'
                : isDarkMode
                ? 'bg-[#25272e] text-blue-400 hover:bg-[#2e313b]'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
            title="Where this code works properly (VS Code Guide)"
          >
            <Laptop className="w-3 h-3" />
            <span>VS Code Guide</span>
            {showVscodeGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Toggle Line Numbers */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`px-2 py-1 rounded-md transition-colors text-[11px] font-sans ${
              showLineNumbers
                ? isDarkMode ? 'bg-[#292a30] text-blue-400' : 'bg-white text-blue-600 shadow-xs'
                : 'opacity-60 hover:opacity-100'
            }`}
            title="Toggle line numbers"
          >
            # Lines
          </button>

          {/* Run in Sandbox if runnable */}
          {isRunnable && onOpenSandbox && (
            <button
              onClick={() => onOpenSandbox(value, cleanLang)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] font-sans transition-all shadow-sm"
              title="Execute code in interactive sandbox"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Live</span>
            </button>
          )}

          {/* Download as ZIP (.zip) with README & VS Code setup */}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-sans text-[11px] font-semibold cursor-pointer ${
              zipDownloaded
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : isDarkMode
                ? 'bg-gradient-to-r from-blue-950/60 to-indigo-950/60 hover:from-blue-900/80 hover:to-indigo-900/80 text-blue-300 border border-blue-500/30 shadow-xs'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 shadow-xs'
            }`}
            title="Download complete code as a .ZIP archive (includes source code, README.md, and VS Code execution guide)"
          >
            {isZipping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : zipDownloaded ? (
              <Check className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <FolderArchive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )}
            <span>{zipDownloaded ? 'ZIP Saved!' : isZipping ? 'Zipping...' : 'Download ZIP'}</span>
          </button>

          {/* Download Single File */}
          <button
            onClick={handleDownload}
            className={`p-1.5 rounded-md transition-colors opacity-75 hover:opacity-100 ${
              isDarkMode ? 'hover:bg-[#28292d]' : 'hover:bg-gray-200'
            }`}
            title={`Download as single ${meta.ext} file`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors font-sans text-[11px] font-medium ${
              copied
                ? 'bg-emerald-500/10 text-emerald-400'
                : isDarkMode
                ? 'hover:bg-[#28292d] text-gray-200'
                : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-md transition-colors opacity-75 hover:opacity-100 ${
              isDarkMode ? 'hover:bg-[#28292d]' : 'hover:bg-gray-200'
            }`}
            title={isExpanded ? 'Minimize' : 'Expand full screen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* VS Code & Environment Helper Drawer */}
      {showVscodeGuide && (
        <div
          className={`px-4 py-3 border-b text-xs leading-relaxed transition-all ${
            isDarkMode
              ? 'bg-[#181a20] border-[#2a2b2f] text-gray-200'
              : 'bg-blue-50/70 border-blue-200 text-gray-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                IDE Setup
              </span>
              <span className="font-semibold text-xs">Where this code works properly:</span>
              <span className="text-blue-400 font-mono text-[11px] font-semibold">{meta.ide}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="opacity-70">Recommended VS Code Extension:</span>
              <span className="font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {meta.vscodeExt}
              </span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 font-mono text-[11px] ${
              isDarkMode ? 'bg-[#101114] border-[#2d2f36]' : 'bg-white border-blue-200 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="opacity-60 select-none">Run in VS Code Terminal:</span>
              <code className="text-amber-400 font-bold truncate">{meta.runCommand}</code>
            </div>
            <button
              onClick={handleCopyCmd}
              className={`px-2 py-1 rounded transition-colors text-[10px] font-sans font-medium shrink-0 flex items-center gap-1 ${
                cmdCopied
                  ? 'bg-emerald-600 text-white'
                  : isDarkMode
                  ? 'bg-[#24262d] hover:bg-[#2f323c] text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {cmdCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{cmdCopied ? 'Copied' : 'Copy Command'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Code Editor Body */}
      <div className="relative overflow-x-auto text-xs font-mono leading-relaxed p-4">
        <div className="flex">
          {/* Line Numbers */}
          {showLineNumbers && (
            <div
              className={`select-none pr-4 text-right border-r mr-4 font-mono text-[11px] opacity-40 shrink-0 ${
                isDarkMode ? 'border-[#2a2b2f] text-gray-500' : 'border-gray-300 text-gray-400'
              }`}
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}

          {/* Code Text with Prism syntax */}
          <pre className="flex-1 overflow-x-auto m-0 p-0 font-mono text-[12px] bg-transparent">
            {highlightedHtml ? (
              <code
                className={`language-${cleanLang}`}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <code>{value}</code>
            )}
          </pre>
        </div>
      </div>

      {/* Code Footer: Environment & VS Code compatibility notice */}
      <div
        className={`px-4 py-2 border-t flex flex-wrap items-center justify-between text-[11px] ${
          isDarkMode
            ? 'bg-[#18191d] border-[#26272c] text-gray-400'
            : 'bg-[#edf2f7] border-gray-200 text-gray-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Laptop className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Works properly in: <strong className="text-gray-200">{meta.ide}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>Save as: <strong className="text-emerald-400">code{meta.ext}</strong></span>
          <span className="opacity-40">•</span>
          <button
            onClick={() => setShowVscodeGuide(!showVscodeGuide)}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            {showVscodeGuide ? 'Hide VS Code Setup' : 'How to run in VS Code'}
          </button>
        </div>
      </div>
    </div>
  );
};
