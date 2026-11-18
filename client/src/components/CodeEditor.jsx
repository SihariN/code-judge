import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ value, onChange, onSubmit }) {
  // The Ctrl+Enter shortcut is registered once, so it must call the
  // *latest* submit handler (which sees the latest code), not a stale one.
  const submitRef = useRef(onSubmit);

  useEffect(() => {
    submitRef.current = onSubmit;
  });

  return (
    <Editor
      height="380px"
      language="python"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={(editor, monaco) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          submitRef.current();
        });
      }}
      loading={<div className="p-4 text-slate-400">Loading editor...</div>}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 4,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12 },
      }}
    />
  );
}