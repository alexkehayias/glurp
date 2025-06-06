import "xterm/css/xterm.css";
import { Terminal } from 'xterm';
import { Readline } from "xterm-readline";
import * as monaco from 'monaco-editor';

// Monaco Editor Setup (left pane)
const monacoRoot = document.getElementById('monaco-root');
if (!monacoRoot) throw new Error("Missing #monaco-root element");
const editor = monaco.editor.create(monacoRoot, {
  value: [
    '# Type your Python code here!',
    'print("Hello from Monaco!")',
    ''
  ].join('\n'),
  language: 'python',
  theme: 'vs-dark',
  automaticLayout: true,
  fontFamily: 'Fira Mono, Consolas, Menlo, monospace',
  fontSize: 15,
  minimap: { enabled: false }
});

// Xterm.js + Readline Setup (right pane)
const termRoot = document.getElementById('terminal-root');
if (!termRoot) throw new Error("Missing #terminal-root element");
const term = new Terminal({
  theme: {
    background: "#222",
    foreground: "#ecf0f1",
  },
  fontFamily: 'Fira Mono, Consolas, Menlo, monospace',
  fontSize: 16,
  cursorBlink: true,
  scrollback: 1000,
});
const rl = new Readline();

term.loadAddon(rl);
term.open(termRoot);
term.focus();

let pyodide: any = null; // Pyodide runtime object
let prompt = '>>> ';

(async () => {
  term.writeln('In-browser Python REPL powered by xterm.js + Pyodide');
  term.writeln('\nLoading Pyodide...');
  // Note: TypeScript cannot type-check dynamic CDN imports. Use "any".
  const pyodideMod: any = await import('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs' as any);
  const loadPyodide = pyodideMod.loadPyodide;
  pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
  term.writeln('Pyodide loaded!');
  term.writeln('Loading and installing micropip...');
  await pyodide.loadPackage('micropip');
  const micropip = pyodide.pyimport('micropip');
  term.writeln('Installing typing-extensions>=4.8.0 via micropip...');
  await micropip.install(['typing-extensions>=4.8.0']);
  term.writeln('Loading ssl, distutils, setuptools...');
  await pyodide.loadPackage(['ssl', 'distutils', 'setuptools']);
  term.writeln('Installing fastapi via micropip...');
  await micropip.install(['fastapi']);
  term.writeln('Packages installed!');
  mainReplLoop();
})();

function printToTerminal(text = ''): void {
  text.split('\n').forEach(line => rl.println(line));
}

async function mainReplLoop(): Promise<void> {
  while (true) {
    let code: string;
    try {
      code = await rl.read(prompt);
    } catch {
      break;
    }
    if (!pyodide) {
      printToTerminal('Pyodide not ready');
      continue;
    }
    await runPythonInREPL(code);
  }
}

// Evaluate Python code in REPL, show output/errors
async function runPythonInREPL(code: string): Promise<void> {
  try {
    await pyodide.loadPackagesFromImports(code);
    let result = await pyodide.runPythonAsync(code);
    if (result !== undefined) printToTerminal(result.toString());
  } catch (err: unknown) {
    printToTerminal((err as Error).toString());
  }
}

// Clipboard integration (DOM event only)
termRoot.addEventListener('paste', (event: ClipboardEvent) => {
  event.preventDefault();
  const clip = event.clipboardData;
  if (clip) {
    const pastedText = clip.getData('text');
    // @ts-ignore
    if (typeof rl.paste === 'function') (rl as any).paste(pastedText); // xterm-readline v1.1.2: paste is dynamic
  }
});

// Expose to window for debugging (cast as any for non-TS props)
(window as any).editor = editor;
(window as any).term = term;
(window as any).pyodide = pyodide;
(window as any).runPythonInREPL = runPythonInREPL;
