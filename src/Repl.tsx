import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { Readline } from "xterm-readline";
import { FitAddon } from "@xterm/addon-fit";
import { useEval } from './EvalContext';

const Repl: React.FC = () => {
  const termHandle = useRef<Terminal>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const { runReplCommand, pyodideReady, output, error } = useEval();

  useEffect(() => {
    if (output) {
      const term = termHandle.current;
      if (term) {
        // Clear out the last line of input so this works when using
        // the repl directly or running the code from the code editor.
        term.write('\x1b[2K\r');
        output.split("\n").forEach((line) => term.writeln(line));
        term.write('>>> ')
      }
    };
  }, [output])

  useEffect(() => {
    if (error) {
      const term = termHandle.current;
      if (term) {
        term.write('\x1b[2K\r');
        error.split("\n").forEach((line) => term.writeln(line));
        term.write('>>> ')
      }
    };
  }, [error])

  useEffect(() => {
    if (!termRef.current || !pyodideReady) return;

    const term = new Terminal({
      theme: {
        background: "#222",
        foreground: "#ecf0f1",
      },
      fontFamily: "Fira Mono, Consolas, Menlo, monospace",
      fontSize: 14,
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

    termHandle.current = term;

    // Dynamically fit on window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    let prompt = ">>> ";
    term.writeln("Python REPL (using shared Pyodide instance)");
    term.writeln("Type Python code and press Enter to execute");

    function printToTerminal(text = ""): void {
      //
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
    <div className="px-4 w-full h-full" style={{background: "#222"}}>
      <div
        ref={termRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default Repl;
