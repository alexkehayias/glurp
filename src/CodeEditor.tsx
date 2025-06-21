import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { useEval } from '@/EvalContext';
import deepSearchCode from '@/py/tools/deep_search.py?raw';

const INITIAL_CODE = deepSearchCode;

const CodeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { evalCode, output, error } = useEval();

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = monaco.editor.create(editorRef.current, {
      value: INITIAL_CODE,
      language: "python",
      theme: "vs-dark",
      automaticLayout: true,
      fontFamily: "Fira Mono, Consolas, Menlo, monospace",
      fontSize: 14,
      minimap: { enabled: false },
    });

    monacoEditorRef.current = editor;
    setTimeout(() => editor.layout(), 100);
    return () => editor.dispose();
  }, []);

  const handleRunCode = () => {
    if (monacoEditorRef.current) {
      evalCode(monacoEditorRef.current.getValue());
    }
  };

  return (
    <div className="w-full h-full min-h-0 min-w-0 relative">
      <div ref={editorRef} className="w-full h-[calc(100%-40px)]" />

      <div className="absolute bottom-0 right-0 p-2">
        <button
          onClick={handleRunCode}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
        >
          ▶ Run
        </button>
      </div>
    </div>
  );
};

export default CodeEditor;
