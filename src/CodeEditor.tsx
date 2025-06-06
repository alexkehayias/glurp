import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";

const INITIAL_CODE = `# Type your Python code here!\nprint(\"Hello from Monaco!\")\n`;

const CodeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Only create editor once
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = monaco.editor.create(editorRef.current, {
      value: INITIAL_CODE,
      language: "python",
      theme: "vs-dark",
      automaticLayout: true,
      fontFamily: "Fira Mono, Consolas, Menlo, monospace",
      fontSize: 15,
      minimap: { enabled: false },
    });
    setTimeout(() => editor.layout(), 100); // Fallback for hydration/layout
    // @ts-ignore
    window.editor = editor; // for debugging
    return () => editor.dispose();
  }, []);
  return <div ref={editorRef} className="w-full h-full min-h-0 min-w-0" />;
};

export default CodeEditor;
