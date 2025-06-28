import React, { createContext, useContext, useState, useEffect } from 'react';
import secrets from '../config/secrets.toml?raw';

interface EvalResult {
  output: string | null;
  error: string | null;
  history: string[]; // REPL command history
}

type EvalContextType = {
  evalCode: (code: string) => Promise<void>;
  runReplCommand: (command: string) => Promise<string | undefined>; // REPL specific
  pyodideReady: boolean;
} & EvalResult;

const EvalContext = createContext<EvalContextType | undefined>(undefined);

export const EvalProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]); // REPL history
  const [pyodideReady, setPyodideReady] = useState(false);

  // Load Pyodide when the provider mounts
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore - Load Pyodide from CDN
        const pyodideMod: any = await import("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs");
        const py = await pyodideMod.loadPyodide();

        await py.loadPackage("micropip");
        const micropip = py.pyimport("micropip");

        await micropip.install("toml");
        // Create secrets module
        const secretsModule = `
import toml
class Secrets(object):
    pass
for (k, v) in toml.loads('${secrets}').items():
    setattr(Secrets, k, v)
        `;
        py.FS.writeFile("/home/pyodide/config.py", secretsModule);

        // FIX: This only outputs the last line when there are
        // multiple lines of text
        py.setStdout(
          {
            batched: (msg: string) => {
              console.log(`Stdout: ${msg}`);
              setOutput(msg);
            }
          }
        );
        py.setStderr(
          {
            batched: (msg: string) => {
              console.log(`Stderr: ${msg}`);
              setError(msg);
          } }
        );

        // Load default packages
        await micropip.install(["typing-extensions>=4.8.0"]);
        await py.loadPackage(["ssl", "setuptools"]);
        await micropip.install(["fastapi"]);

        setPyodide(py);
        setPyodideReady(true);

        // Attach the pyodide instance to `window` for easier
        // debugging
        (window as any).py = py
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
      }
    };

    if (!pyodide) {
      loadPyodide();
    }
  }, []);

  const evalCode = async (code: string) => {
    if (!pyodide) return;

    try {
      setOutput(null);
      setError(null);

      // Execute the code using Pyodide
      const result = await pyodide.runPythonAsync(code);
      if (result) {
        setOutput(result.toString());
      }
    } catch (err) {
      // Handle Python exceptions
      const error = err as Error;
      setError(`Error: ${error.message}`);
    }
  };

  // Special REPL command execution that returns output directly
  const runReplCommand = async (command: string): Promise<string | undefined> => {
    if (!pyodide) return;

    try {
      setOutput(null);
      setError(null);

      const result = await pyodide.runPythonAsync(command);
      setHistory(prev => [...prev, command]); // Add to history

      if (result) {
        const out = result.toString();
        setOutput(out)
        return out
      }
    } catch (err) {
      const error = err as Error;
      setError(error.toString());
      return error.message;
    }
  };

  return (
    <EvalContext.Provider value={{
      evalCode,
      runReplCommand,
      output,
      error,
      history,
      pyodideReady
    }}>
      {children}
    </EvalContext.Provider>
  );
};

export const useEval = () => {
  const context = useContext(EvalContext);
  if (context === undefined) {
    throw new Error('useEval must be used within an EvalProvider');
  }
  return context;
};
