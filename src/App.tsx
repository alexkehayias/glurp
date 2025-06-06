import React, { useCallback } from "react";
import MonacoEditor from "./CodeEditor";
import Repl from "./Repl";
import { proxyFetch } from "./pyodide_server/proxyFetch";

export default function App() {
  const callPyodideServer = useCallback(async () => {
    const resp = await proxyFetch("/hello", { method: "GET" });
    alert(`FastAPI responded: ${resp.status} - ${resp.body}`);
  }, []);

  return (
    <div id="app-root" className="flex h-screen w-screen min-h-0 min-w-0">
      <div id="monaco-root" className="flex flex-col flex-1 min-w-0 h-screen relative">
        <MonacoEditor />
        <button onClick={callPyodideServer}
                className="absolute left-3 bottom-3 bg-green-700 hover:bg-green-600 text-white rounded px-3 py-1">
          Call in-browser FastAPI: /hello
        </button>
      </div>
      <div id="terminal-root" className="flex flex-col flex-1 min-w-0 h-screen relative">
        <Repl />
      </div>
    </div>
  );
}
