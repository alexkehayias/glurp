import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { Readline } from "xterm-readline";
import { FitAddon } from "@xterm/addon-fit";
import { useEval } from './EvalContext';

const Repl: React.FC = () => {
  const termRef = useRef<HTMLDivElement>(null);
  const { runReplCommand, pyodideReady } = useEval();

  useEffect(() => {
    if (!termRef.current || !pyodideReady) return;
    
    const term = new Terminal({
      theme: {
        background: "#222",
        foreground: "#ecf0f1",
      },
      fontFamily: "Fira Mono, Consolas, Menlo, monospace",
      fontSize: 16,
      cursorBlink: true,
      scrollback: 1000,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    const rl = new Readline();
    term.loadAddon(rl);
    
    term.open(termRef.current);
    fitAddon.fit();
    term.focus();

    // Dynamically fit on window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    let prompt = ">>> ";
    term.writeln("Python REPL (using shared Pyodide instance)");
    term.writeln("Type Python code and press Enter to execute");

    function printToTerminal(text = ""): void {
      text.split("\n").forEach((line) => rl.println(line));
    }

    async function mainReplLoop(): Promise<void> {
      while (true) {
        let code: string;
        try {
          code = await rl.read(prompt);
        } catch {
          break;
        }

        if (!code.trim()) continue;
        
        const result = await runReplCommand(code);
        if (result) {
          printToTerminal(result.toString());
        }
      }
    }

    mainReplLoop();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [pyodideReady]); // Only re-run if pyodide readiness changes

  return (
    <div 
      ref={termRef} 
      className="w-full h-full"
    />
  );
};

export default Repl;