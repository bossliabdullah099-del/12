import JSZip from 'jszip';

export interface CodeFile {
  filename: string;
  content: string;
  language?: string;
}

export interface ExportZipOptions {
  code: string;
  language?: string;
  customFilename?: string;
  projectName?: string;
  additionalFiles?: Record<string, string>;
  readmeExtra?: string;
}

// Maps code languages to default filenames, execution commands, and VS Code extensions
const LANGUAGE_CONFIG: Record<
  string,
  {
    defaultFile: string;
    ext: string;
    runCommand: string;
    vscodeExtension: string;
    runtime: string;
  }
> = {
  javascript: {
    defaultFile: 'app.js',
    ext: '.js',
    runCommand: 'node app.js',
    vscodeExtension: 'JavaScript and TypeScript (Built-in) / ESLint',
    runtime: 'Node.js (https://nodejs.org)',
  },
  js: {
    defaultFile: 'app.js',
    ext: '.js',
    runCommand: 'node app.js',
    vscodeExtension: 'JavaScript and TypeScript (Built-in) / ESLint',
    runtime: 'Node.js (https://nodejs.org)',
  },
  typescript: {
    defaultFile: 'app.ts',
    ext: '.ts',
    runCommand: 'npx tsx app.ts',
    vscodeExtension: 'TypeScript and JavaScript Language Features',
    runtime: 'Node.js + tsx / ts-node',
  },
  ts: {
    defaultFile: 'app.ts',
    ext: '.ts',
    runCommand: 'npx tsx app.ts',
    vscodeExtension: 'TypeScript and JavaScript Language Features',
    runtime: 'Node.js + tsx / ts-node',
  },
  jsx: {
    defaultFile: 'App.jsx',
    ext: '.jsx',
    runCommand: 'npm run dev',
    vscodeExtension: 'ES7+ React/Redux/React-Native snippets',
    runtime: 'Vite / React Node.js',
  },
  tsx: {
    defaultFile: 'App.tsx',
    ext: '.tsx',
    runCommand: 'npm run dev',
    vscodeExtension: 'ES7+ React/Redux/React-Native snippets',
    runtime: 'Vite / React Node.js',
  },
  python: {
    defaultFile: 'main.py',
    ext: '.py',
    runCommand: 'python main.py',
    vscodeExtension: 'Python (by Microsoft)',
    runtime: 'Python 3.x (https://python.org)',
  },
  py: {
    defaultFile: 'main.py',
    ext: '.py',
    runCommand: 'python main.py',
    vscodeExtension: 'Python (by Microsoft)',
    runtime: 'Python 3.x (https://python.org)',
  },
  html: {
    defaultFile: 'index.html',
    ext: '.html',
    runCommand: 'Open index.html in any Web Browser or right-click -> Open with Live Server in VS Code',
    vscodeExtension: 'Live Server (by Ritwick Dey)',
    runtime: 'Web Browser (Chrome, Edge, Firefox, Safari)',
  },
  css: {
    defaultFile: 'style.css',
    ext: '.css',
    runCommand: 'Include <link rel="stylesheet" href="style.css"> in your index.html',
    vscodeExtension: 'Tailwind CSS IntelliSense / Prettier',
    runtime: 'Web Browser',
  },
  cpp: {
    defaultFile: 'main.cpp',
    ext: '.cpp',
    runCommand: 'g++ main.cpp -o main && ./main',
    vscodeExtension: 'C/C++ (by Microsoft)',
    runtime: 'GCC / MinGW / Clang compiler',
  },
  c: {
    defaultFile: 'main.c',
    ext: '.c',
    runCommand: 'gcc main.c -o main && ./main',
    vscodeExtension: 'C/C++ (by Microsoft)',
    runtime: 'GCC / MinGW / Clang compiler',
  },
  csharp: {
    defaultFile: 'Program.cs',
    ext: '.cs',
    runCommand: 'dotnet run',
    vscodeExtension: 'C# Dev Kit (by Microsoft)',
    runtime: '.NET SDK (https://dotnet.microsoft.com)',
  },
  cs: {
    defaultFile: 'Program.cs',
    ext: '.cs',
    runCommand: 'dotnet run',
    vscodeExtension: 'C# Dev Kit (by Microsoft)',
    runtime: '.NET SDK (https://dotnet.microsoft.com)',
  },
  java: {
    defaultFile: 'Main.java',
    ext: '.java',
    runCommand: 'javac Main.java && java Main',
    vscodeExtension: 'Extension Pack for Java (by Microsoft)',
    runtime: 'Java JDK 17+ (https://oracle.com/java)',
  },
  rust: {
    defaultFile: 'main.rs',
    ext: '.rs',
    runCommand: 'rustc main.rs && ./main (or: cargo run)',
    vscodeExtension: 'rust-analyzer',
    runtime: 'Rust / Cargo (https://rust-lang.org)',
  },
  go: {
    defaultFile: 'main.go',
    ext: '.go',
    runCommand: 'go run main.go',
    vscodeExtension: 'Go (by Go Team at Google)',
    runtime: 'Go (https://golang.org)',
  },
  php: {
    defaultFile: 'index.php',
    ext: '.php',
    runCommand: 'php -S localhost:8000',
    vscodeExtension: 'PHP Intelephense',
    runtime: 'PHP 8.x (https://php.net)',
  },
  bash: {
    defaultFile: 'script.sh',
    ext: '.sh',
    runCommand: 'chmod +x script.sh && ./script.sh',
    vscodeExtension: 'Bash IDE / ShellCheck',
    runtime: 'Bash / Linux / macOS / Git Bash on Windows',
  },
  sh: {
    defaultFile: 'script.sh',
    ext: '.sh',
    runCommand: 'chmod +x script.sh && ./script.sh',
    vscodeExtension: 'Bash IDE / ShellCheck',
    runtime: 'Bash / Linux / macOS / Git Bash on Windows',
  },
  sql: {
    defaultFile: 'queries.sql',
    ext: '.sql',
    runCommand: 'Execute in MySQL / PostgreSQL / SQLite studio',
    vscodeExtension: 'SQLTools',
    runtime: 'PostgreSQL / MySQL / SQLite database',
  },
  json: {
    defaultFile: 'data.json',
    ext: '.json',
    runCommand: 'Import or parse via JSON.parse()',
    vscodeExtension: 'Prettier',
    runtime: 'Standard JSON parser',
  },
};

/**
 * Checks if user prompt is requesting a ZIP file download of the code.
 */
export function isZipRequestPrompt(text: string): boolean {
  if (!text || !text.trim()) return false;
  const t = text.trim().toLowerCase();
  return (
    /\b(zip\s*(file|archive|folder|package)?|download\s*(as\s*)?zip|\.zip|zip\s*me|zip\s*do|zip\s*karo|zip\s*chahiye|zip\s*me\s*code|code\s*(ki\s*)?zip)\b/i.test(t) ||
    /\b(give\s*(me\s*)?(a\s*|the\s*)?zip|provide\s*(a\s*)?zip|send\s*(me\s*)?zip)\b/i.test(t)
  );
}

/**
 * Extracts all code blocks from markdown text with their language and any detected filename comment.
 */
export function extractCodeBlocksFromMarkdown(markdown: string): CodeFile[] {
  if (!markdown) return [];
  const results: CodeFile[] = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let match;
  let index = 1;

  while ((match = regex.exec(markdown)) !== null) {
    const rawLang = (match[1] || 'txt').toLowerCase().trim();
    const content = match[2];
    if (!content.trim()) continue;

    // Check if first line contains a filename comment (e.g. // filename: app.js or # filename: main.py)
    const firstLine = content.split('\n')[0] || '';
    const fnMatch = firstLine.match(/(?:\/\/|#|<!--|\/\*)\s*(?:filename|file):\s*([a-zA-Z0-9_.\-\/\\]+)/i);
    let detectedName = fnMatch ? fnMatch[1].trim() : '';

    if (!detectedName) {
      const config = LANGUAGE_CONFIG[rawLang] || { defaultFile: `code_${index}.txt`, ext: '.txt' };
      detectedName = index === 1 ? config.defaultFile : `file_${index}${config.ext}`;
    }

    results.push({
      filename: detectedName,
      content,
      language: rawLang,
    });
    index++;
  }

  return results;
}

/**
 * Packages single or multiple code files into a clean .zip file with README.md and VS Code instructions,
 * then triggers immediate browser download.
 */
export async function downloadCodeAsZip(options: ExportZipOptions): Promise<boolean> {
  try {
    const zip = new JSZip();
    const cleanLang = (options.language || 'text').toLowerCase().trim();
    const config = LANGUAGE_CONFIG[cleanLang] || {
      defaultFile: 'code.txt',
      ext: '.txt',
      runCommand: 'Open and run in VS Code',
      vscodeExtension: 'Relevant language extension',
      runtime: 'Your language runtime',
    };

    const mainFilename = options.customFilename || config.defaultFile;
    const projectName = options.projectName || `Boss_Aura_AI_Project_${Date.now()}`;

    // 1. Add primary source file
    zip.file(mainFilename, options.code);

    // 2. Add any additional files (e.g. package.json, styles, helper scripts)
    if (options.additionalFiles) {
      Object.entries(options.additionalFiles).forEach(([name, content]) => {
        zip.file(name, content);
      });
    }

    // 3. For web projects, include companion HTML if standalone JS/CSS
    if ((cleanLang === 'javascript' || cleanLang === 'js') && !options.additionalFiles?.['index.html']) {
      zip.file(
        'index.html',
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body style="font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
  <h1>🚀 ${projectName}</h1>
  <p>Generated by <strong>BOSS AURA AI</strong>. Open developer console (F12) to view outputs.</p>
  <script src="${mainFilename}"></script>
</body>
</html>`
      );
    }

    // 4. Generate README.md with comprehensive VS Code instructions
    const readmeContent = `# ${projectName} 🚀
> Generated by **BOSS AURA AI** (Created by admin Ali Abdullah Tariq)

## 📁 Packaged Files:
- \`${mainFilename}\` — Main Source Code
${options.additionalFiles ? Object.keys(options.additionalFiles).map((f) => `- \`${f}\``).join('\n') : ''}
- \`README.md\` — Setup and execution guide

---

## 💻 Where this code works properly & How to run in VS Code:

### 1. Recommended Environment / IDE:
- **Visual Studio Code (VS Code)**
- **Recommended Extension**: ${config.vscodeExtension}
- **Required Runtime**: ${config.runtime}

### 2. Step-by-Step Execution Guide:
1. Extract this \`.zip\` archive to a folder on your computer.
2. Open **VS Code**.
3. Click **File > Open Folder...** and select the extracted folder.
4. Open the integrated terminal in VS Code (\`Ctrl + \`\`\` or \`Terminal > New Terminal\`).
5. Run the following command:
\`\`\`bash
${config.runCommand}
\`\`\`

${options.readmeExtra ? `\n### 📝 Notes:\n${options.readmeExtra}\n` : ''}
---
*Enjoy coding with BOSS AURA AI!*
`;

    zip.file('README.md', readmeContent);

    // 5. Generate ZIP Blob and trigger browser download
    const blob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadFilename = `${projectName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}.zip`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (err) {
    console.error('Failed to generate and download ZIP file:', err);
    return false;
  }
}

/**
 * Packages an array of extracted CodeFiles into a single project ZIP archive.
 */
export async function downloadMultiFileZip(
  files: CodeFile[],
  projectName = `Boss_Aura_AI_Project_${Date.now()}`
): Promise<boolean> {
  if (!files || files.length === 0) return false;

  try {
    const zip = new JSZip();

    files.forEach((file) => {
      zip.file(file.filename, file.content);
    });

    const fileListMarkdown = files.map((f) => `- \`${f.filename}\` (${(f.language || 'text').toUpperCase()})`).join('\n');

    const readmeContent = `# ${projectName} 🚀
> Complete Multi-File Project Generated by **BOSS AURA AI**

## 📦 Project Contents:
${fileListMarkdown}
- \`README.md\` — Step-by-step Execution Instructions

---

## 💻 How to Open and Run in VS Code:
1. Extract this \`.zip\` archive into any folder on your computer.
2. Launch **VS Code (Visual Studio Code)**.
3. Choose **File > Open Folder...** and pick the extracted project folder.
4. If your project contains:
   - **HTML/CSS/JS**: Right-click \`index.html\` and choose **Open with Live Server**, or double-click to open in your browser.
   - **Node / React**: Open the VS Code terminal and run:
     \`\`\`bash
     npm install
     npm run dev
     \`\`\`
   - **Python**: Open terminal and run:
     \`\`\`bash
     python ${files.find((f) => f.filename.endsWith('.py'))?.filename || 'main.py'}
     \`\`\`
   - **C++**: Open terminal and run:
     \`\`\`bash
     g++ ${files.find((f) => f.filename.endsWith('.cpp'))?.filename || 'main.cpp'} -o main && ./main
     \`\`\`

---
*Created with BOSS AURA AI — Enterprise Polyglot Edition*
`;

    zip.file('README.md', readmeContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(blob);
    const safeZipName = `${projectName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}.zip`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = safeZipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (err) {
    console.error('Failed to generate multi-file project ZIP:', err);
    return false;
  }
}
