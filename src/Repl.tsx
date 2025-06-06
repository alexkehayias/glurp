import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { Readline } from "xterm-readline";
import { FitAddon } from "@xterm/addon-fit";

const Repl: React.FC = () => {
  const termRef = useRef<HTMLDivElement>(null);
  // Only run once
  useEffect(() => {
    if (!termRef.current) return;
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
    let pyodide: any = null;
    (async () => {
      term.writeln("In-browser Python REPL powered by xterm.js + Pyodide");
      term.writeln("\nLoading Pyodide...");
      // @ts-ignore
      const pyodideMod: any = await import("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs");
      const loadPyodide = pyodideMod.loadPyodide;
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
      });
      term.writeln("Pyodide loaded!");
      term.writeln("Loading and installing micropip...");
      await pyodide.loadPackage("micropip");
      const micropip = pyodide.pyimport("micropip");
      term.writeln("Installing typing-extensions>=4.8.0 via micropip...");
      await micropip.install(["typing-extensions>=4.8.0"]);
      term.writeln("Loading ssl, distutils, setuptools...");
      await pyodide.loadPackage(["ssl", "distutils", "setuptools"]);
      term.writeln("Installing fastapi via micropip...");
      await micropip.install(["fastapi"]);
      term.writeln("Packages installed!");
      await mainReplLoop();
    })();
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
        if (!pyodide) {
          printToTerminal("Pyodide not ready");
          continue;
        }
        await runPythonInREPL(code);
      }
    }
    async function runPythonInREPL(code: string): Promise<void> {
      try {
        await pyodide.loadPackagesFromImports(code);
        let result = await pyodide.runPythonAsync(code);
        if (result !== undefined) printToTerminal(result.toString());
      } catch (err: unknown) {
        printToTerminal((err as Error).toString());
      }
    }
    termRef.current.addEventListener("paste", (event: any) => {
      event.preventDefault();
      const clip = event.clipboardData;
      if (clip) {
        const pastedText = clip.getData("text");
        // @ts-ignore
        if (typeof rl.paste === "function") (rl as any).paste(pastedText);
      }
    });
    // Debug expose
    (window as any).term = term;
    (window as any).pyodide = pyodide;
    (window as any).runPythonInREPL = runPythonInREPL;
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return <div ref={termRef} className="w-full h-full" />;
};
export default Repl;
