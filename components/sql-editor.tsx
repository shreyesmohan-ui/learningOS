"use client";

import { useMemo } from "react";
import CodeMirror, { EditorState, EditorView, keymap } from "@uiw/react-codemirror";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const language = sql({ dialect: PostgreSQL, schema: {
  customers: ["id", "name", "city"], orders: ["id", "customer_id", "order_date", "status", "total"],
} });
const colors = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.keyword, color: "#a6d9ca" }, { tag: tags.string, color: "#e4cd8e" },
  { tag: tags.number, color: "#e4aab0" }, { tag: tags.comment, color: "#8b9a90", fontStyle: "italic" },
  { tag: tags.operator, color: "#b5c7d9" }, { tag: tags.typeName, color: "#b5c7d9" },
]));
const editorTheme = EditorView.theme({
  "&": { backgroundColor: "#212729", color: "#dde7e1", fontSize: "13px" },
  ".cm-content": { padding: "16px 0", caretColor: "#b9edcc" },
  ".cm-line": { padding: "0 16px 0 4px", lineHeight: "24px" },
  ".cm-scroller": { fontFamily: "'Cascadia Code', Consolas, monospace" },
  ".cm-gutters": { backgroundColor: "#212729", color: "#819087", border: "none", minWidth: "42px" },
  ".cm-activeLineGutter, .cm-activeLine": { backgroundColor: "#2b3430" },
  "&.cm-focused": { outline: "none", boxShadow: "inset 3px 0 #4e9d7c" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "#40584b" },
  ".cm-tooltip": { backgroundColor: "#2b3430", border: "1px solid #536759", color: "#d9e6dc" },
}, { dark: true });

export default function SqlEditor({ value, onChange, onRun, disabled }: {
  value: string; onChange: (value: string) => void; onRun: () => void; disabled: boolean;
}) {
  const extensions = useMemo(() => [language, colors,
    EditorView.contentAttributes.of({ "aria-label": "SQL query" }),
    EditorState.changeFilter.of(transaction => transaction.newDoc.length <= 12000),
    keymap.of([{ key: "Mod-Enter", run: () => { if (!disabled) onRun(); return true; } }]),
  ], [onRun, disabled]);
  return <CodeMirror value={value} onChange={onChange} height="258px" theme={editorTheme} extensions={extensions}
    editable={!disabled} readOnly={disabled} indentWithTab={false}
    basicSetup={{ foldGutter: false, highlightActiveLine: true, highlightSelectionMatches: true }} />;
}
