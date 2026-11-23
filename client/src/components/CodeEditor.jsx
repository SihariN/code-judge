import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({
  value,
  onChange,
  onSubmit,
  readOnly = false,
  height = "380px",
}) {
  // The Ctrl+Enter shortcut is registered once, so it must call the
  // *latest* submit handler (which sees the latest code), not a stale one.
  const submitRef = useRef(onSubmit);

  useEffect(() => {
    submitRef.current = onSubmit;
  });

  return (
    <Editor
      height={height}
      language="python"
      theme="vs-dark"
      value={value}
      onChange={(v) => {
        if (onChange) onChange(v ?? "");
      }}
      onMount={(editor, monaco) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          if (submitRef.current) submitRef.current();
        });
      }}
      loading={<div className="p-4 text-slate-400">Loading editor...</div>}

      options={{
        readOnly,
        minimap: { enabled: false },

        // Code appearance
        fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
        fontSize: 14,
        fontLigatures: true,
        lineHeight: 24,
        tabSize: 4,

        // Editor interaction
        cursorStyle: "line",
        cursorBlinking: "smooth",
        renderLineHighlight: "line",
        smoothScrolling: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,

        // Code readability
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: true,
          bracketPairs: true,
        },

        // Spacing
        padding: {
          top: 16,
          bottom: 16,
        },

        overviewRulerBorder: false,
      }}

    />
  );
}