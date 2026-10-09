"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, ArrowRight, BookOpen, Braces, Check, CheckCheck, ChevronRight, Circle, CircleHelp, Database, FlaskConical, KeyRound, Lightbulb, LoaderCircle, LockKeyhole, Play, RotateCcw, ShieldCheck, Sparkles, Table2, Terminal } from "lucide-react";
import { exercises, schema } from "@/lib/curriculum";
import type { Exercise, Phase } from "@/lib/curriculum";
import { runSQL } from "@/lib/engine-client";
import type { RunResult } from "@/lib/engine-client";
import { attemptsSchema, csvExport, phaseScore } from "@/lib/study";
import type { Attempt } from "@/lib/study";
import { useCloud } from "@/hooks/use-cloud";
import { saveCloudAttempt } from "@/lib/cloud";
import type { StudyCondition } from "@/lib/cloud";
import CloudRecords from "./cloud-records";

type View = "practice" | "assessment" | "evidence";
type Hint = { text: string; provider: "authored" | "groq"; model?: string | null };
type Help = { hints: Hint[]; revealed: boolean };
const practice = exercises.filter(e => e.phase === "practice");
const storageKey = "learning-os-attempts-v1";
const blank = "SELECT\n  \nFROM customers;";
const SqlEditor = dynamic(() => import("./sql-editor"), { ssr: false, loading: () => <div className="editor-loading">Loading editor...</div> });

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function LearningWorkspace() {
  const cloud = useCloud();
  const [condition, setCondition] = useState<StudyCondition>("coached");
  const [consent, setConsent] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [view, setView] = useState<View>("practice");
  const [selectedId, setSelectedId] = useState("p1");
  const [query, setQuery] = useState(blank);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [help, setHelp] = useState<Record<string, Help>>({});
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [session, setSession] = useState("");
  const [participant, setParticipant] = useState("demo");
  const [loaded, setLoaded] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [resultQuery, setResultQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const [rightTab, setRightTab] = useState<"coach" | "schema">("coach");
  const [activeTest, setActiveTest] = useState<"pretest" | "posttest" | null>(null);
  const [testIndex, setTestIndex] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    setSession(crypto.randomUUID());
    started.current = Date.now();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = attemptsSchema.safeParse(JSON.parse(saved));
        if (parsed.success) setAttempts(parsed.data);
        else setStorageNotice("Saved records could not be read. This session will start fresh.");
      }
    } catch { setStorageNotice("Browser storage is unavailable. Export this session before closing."); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(attempts)); }
    catch { setStorageNotice("Records could not be saved. Export this session before closing."); }
  }, [attempts, loaded]);

  const current = exercises.find(e => e.id === selectedId)!;
  const currentHelp = help[selectedId] || { hints: [], revealed: false };
  const sessionAttempts = attempts.filter(a => a.session === session);
  const solvedIds = new Set(sessionAttempts.filter(a => a.phase === "practice" && a.correct).map(a => a.exerciseId));
  const independentIds = new Set(sessionAttempts.filter(a => a.phase === "practice" && a.correct && !a.assisted).map(a => a.exerciseId));
  const before = phaseScore(sessionAttempts, "pretest");
  const after = phaseScore(sessionAttempts, "posttest");
  const previousIndependent = sessionAttempts.some(a => a.correct && !a.assisted && exercises.find(e => e.id === a.exerciseId)?.concept === current.concept);
  const attempted = sessionAttempts.some(a => a.exerciseId === selectedId);
  const testExercises = activeTest ? exercises.filter(e => e.phase === activeTest) : [];
  const locked = busy || hintBusy;

  function choose(exercise: Exercise) {
    setDrafts(previous => ({ ...previous, [selectedId]: query }));
    setSelectedId(exercise.id); setQuery(drafts[exercise.id] ?? (exercise.id === "p1" ? blank : "SELECT\n  \nFROM "));
    setResult(null); setResultQuery(""); setError(""); started.current = Date.now();
  }

  function record(correct: boolean, phase: Phase = current.phase) {
    const hints = currentHelp.hints;
    const attempt: Attempt = {
      id: crypto.randomUUID(), session, participant: participant.trim() || "demo", exerciseId: selectedId, phase,
      correct, hints: hints.length, revealed: currentHelp.revealed, assisted: hints.length > 0 || currentHelp.revealed,
      elapsedMs: Math.max(0, Date.now() - started.current), timestamp: new Date().toISOString(),
      provider: hints.some(h => h.provider === "groq") ? "groq" : hints.length ? "authored" : "none",
      query, kind: "device-local-prototype",
      condition, model: hints.find(h => h.provider === "groq")?.model ?? null,
      datasetId: "northstar-v1", promptVersion: condition === "coached" ? "coach-v1" : "answer-v1",
    };
    setAttempts(previous => [...previous.slice(-4999), attempt]);
    if (cloud.client && cloud.user && consent) {
      void saveCloudAttempt(cloud.client, attempt, condition, "northstar-v1")
        .then(() => setCloudStatus("Saved to Supabase"))
        .catch(cause => setCloudStatus(cause instanceof Error ? cause.message : "Cloud save failed; record retained locally."));
    }
  }

  async function syncSession() {
    if (!cloud.client || !cloud.user || !consent) return;
    setCloudStatus("Syncing...");
    try {
      for (const attempt of sessionAttempts) await saveCloudAttempt(cloud.client, attempt, condition, "northstar-v1");
      setCloudStatus(`${sessionAttempts.length} records synced to Supabase`);
    } catch (cause) { setCloudStatus(cause instanceof Error ? cause.message : "Sync failed; records retained locally."); }
  }

  async function run() {
    if (locked || !query.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const outcome = await runSQL(selectedId, query, cloud.remoteSeed);
      setResult(outcome); setResultQuery(query);
      if (!activeTest) record(outcome.correct);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Query failed."); }
    finally { setBusy(false); }
  }

  async function requestHint() {
    if (current.phase !== "practice" || locked || currentHelp.hints.length >= (condition === "coached" ? 3 : 1)) return;
    setHintBusy(true);
    let hint: Hint = { text: condition === "coached" ? current.hints[currentHelp.hints.length] : current.solution + "\n\n" + current.explanation, provider: "authored" };
    try {
      const token = cloud.client ? (await cloud.client.auth.getSession()).data.session?.access_token : undefined;
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ exerciseId: selectedId, query, level: currentHelp.hints.length, condition }), signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        const body = await response.json() as { hint?: unknown; provider?: unknown; model?: unknown };
        if (typeof body.hint === "string") hint = { text: body.hint, provider: body.provider === "groq" ? "groq" : "authored", model: typeof body.model === "string" ? body.model : null };
      }
    } catch { /* Keep the authored fallback available without a live provider. */ }
    setHelp(previous => ({ ...previous, [selectedId]: { ...currentHelp, revealed: condition === "answer_first" || currentHelp.revealed, hints: [...currentHelp.hints, hint] } }));
    setHintBusy(false);
  }

  function beginTest(phase: "pretest" | "posttest") {
    const first = exercises.find(e => e.phase === phase)!;
    choose(first); setActiveTest(phase); setTestIndex(0); setRightTab("schema");
  }

  function submitTest(skip = false) {
    record(!skip && resultQuery === query && !!result?.correct);
    if (testIndex + 1 < testExercises.length) { choose(testExercises[testIndex + 1]); setTestIndex(i => i + 1); }
    else { setActiveTest(null); setView("evidence"); setResult(null); }
  }

  function navigate(next: View) {
    if (locked || activeTest) return;
    if (next === "practice" && current.phase !== "practice") choose(practice[0]);
    setView(next);
  }

  function newSession() {
    if (!window.confirm("Start a new session? Existing records stay available in the full export.")) return;
    setSession(crypto.randomUUID()); setParticipant("demo"); setHelp({}); setDrafts({}); setConsent(false); setCloudStatus("");
    setSelectedId("p1"); setQuery(blank); setResult(null); setError(""); setView("practice"); started.current = Date.now();
  }

  const isWorkspace = view === "practice" || (view === "assessment" && activeTest);
  return (
    <div className="app-shell">
      <header className="app-header">
        <a href="/" className="brand" aria-label="Learning OS home"><span className="brand-mark"><Braces size={23}/></span><span>Learning<span className="brand-os">OS</span></span><span className="studio-label">SQL Studio</span></a>
        <nav className="main-nav" aria-label="Workspace">
          <button disabled={locked || !!activeTest} className={view === "practice" ? "active" : ""} onClick={() => navigate("practice")}><Terminal size={16}/>Practice</button>
          <button disabled={locked || !!activeTest} className={view === "assessment" ? "active" : ""} onClick={() => navigate("assessment")}><ShieldCheck size={16}/>Checkpoints</button>
          <button disabled={locked || !!activeTest} className={view === "evidence" ? "active" : ""} onClick={() => navigate("evidence")}><FlaskConical size={16}/>Evidence</button>
        </nav>
        <span className="prototype-tag"><span/>Prototype</span>
      </header>
      {storageNotice && <div className="notice warning" role="status">{storageNotice}</div>}
      <div className="dataset-bar"><span><Database size={14}/><strong>Northstar Market</strong><span className="muted">Synthetic dataset</span></span><span className="muted">PostgreSQL <span className="bar-divider">/</span> 2 tables <span className="bar-divider">/</span> 36 rows</span></div>
      <div className="session-strip"><span>{cloud.status}</span><fieldset disabled={locked || !!activeTest || !!sessionAttempts.length || Object.keys(help).length > 0}><legend>Support condition</legend><label><input type="radio" name="condition" checked={condition === "coached"} onChange={() => setCondition("coached")}/>Coached</label><label><input type="radio" name="condition" checked={condition === "answer_first"} onChange={() => setCondition("answer_first")}/>Answer-first</label></fieldset><span>{cloud.config?.liveTutor && cloud.user ? "Live AI enabled" : "Authored support"}</span></div>

      {isWorkspace ? <div className="workspace-grid">
        <aside className="curriculum-sidebar">
          <div className="sidebar-heading"><span className="eyebrow">{activeTest ? "Independent checkpoint" : "Your learning path"}</span><BookOpen size={15}/></div>
          <h2>{activeTest ? (activeTest === "pretest" ? "Starting point" : "Without the coach") : "SQL foundations"}</h2>
          <p className="subtle">{activeTest ? `${testIndex + 1} of 3 questions` : `${solvedIds.size} of 6 completed`}</p>
          <div className="path-progress"><span style={{ width: `${(activeTest ? testIndex / 3 : solvedIds.size / 6) * 100}%` }}/></div>
          {activeTest ? <div className="test-list">{testExercises.map((e, i) => <div className={`test-list-item ${i === testIndex ? "current" : ""}`} key={e.id}><span>{i < testIndex ? <Check size={14}/> : i + 1}</span>{e.title}</div>)}</div> : <div className="exercise-groups">{(["Filtering", "Joins", "Aggregation"] as const).map((concept, groupIndex) => <section key={concept} className="exercise-group"><h3><span>0{groupIndex + 1}</span>{concept}</h3>{practice.filter(e => e.concept === concept).map(e => <button key={e.id} disabled={locked} onClick={() => choose(e)} className={`exercise-item ${e.id === selectedId ? "selected" : ""}`} aria-current={e.id === selectedId ? "step" : undefined}><span className={solvedIds.has(e.id) ? "solved marker" : "marker"}>{solvedIds.has(e.id) ? <Check size={13}/> : <Circle size={13}/>}</span><span>{e.title}</span>{e.id === selectedId && <ChevronRight size={14}/>}</button>)}</section>)}</div>}
          <div className="sidebar-foot"><ShieldCheck size={20}/><div><strong>{activeTest ? "Coach disabled" : "Independence first"}</strong><span>{activeTest ? "No hints or solutions" : `${independentIds.size} solved without help`}</span></div></div>
        </aside>

        <main className="editor-main">
          <section className="task-brief">
            <div className="task-meta"><span className="eyebrow">{activeTest ? "Checkpoint" : `Exercise ${practice.findIndex(e => e.id === selectedId) + 1}`}</span><span className={`concept-tag ${current.concept.toLowerCase()}`}>{current.concept}</span>{activeTest && <span className="lock-label"><LockKeyhole size={12}/>Unaided</span>}</div>
            <h1>{current.title}</h1><p>{current.prompt}</p>
            <div className="output-columns"><span>Output</span>{current.columns.map(column => <code key={column}>{column}</code>)}</div>
          </section>
          <section className="query-panel" aria-label="SQL editor">
            <div className="editor-toolbar"><span><Terminal size={15}/>query.sql</span><div><span className="engine-label">PostgreSQL</span><button className="icon-button dark" title="Reset query" aria-label="Reset query" disabled={locked} onClick={() => { if (window.confirm("Reset this query?")) { setQuery("SELECT\n  \nFROM "); setResult(null); setError(""); } }}><RotateCcw size={15}/></button></div></div>
            <SqlEditor value={query} onChange={setQuery} onRun={() => void run()} disabled={locked}/>
            <div className="editor-footer"><span><span className="status-dot"/>Read-only workspace</span><button className="run-button" disabled={locked || !query.trim() || !loaded} onClick={() => void run()}>{busy ? <LoaderCircle size={15} className="spin"/> : <Play size={14} fill="currentColor"/>}{busy ? "Running" : "Run query"}</button></div>
          </section>
          <section className="results-panel" aria-label="Query results">
            <div className="results-toolbar"><strong><Table2 size={15}/>Results{result && <span className="count-tag">{result.result.rows.length}</span>}</strong>{result && <span className="muted">{result.durationMs} ms including setup</span>}</div>
            {busy ? <div className="empty-results"><LoaderCircle className="spin" size={24}/><strong>Running in PostgreSQL</strong></div> : error ? <div className="query-error" role="alert"><CircleHelp size={20}/><div><strong>Query could not run</strong><p>{error}</p></div></div> : result ? <><div className={`result-verdict ${activeTest ? "neutral" : result.correct ? "success" : "warning"}`} role="status">{activeTest ? <LockKeyhole size={16}/> : result.correct ? <CheckCheck size={16}/> : <CircleHelp size={16}/>}{activeTest ? "Query ran. Scoring is hidden until the checkpoint is complete." : result.reason}{resultQuery !== query && <span>Query edited since this run.</span>}</div><div className="result-table-scroll"><table><thead><tr>{result.result.fields.map((f, i) => <th key={`${f.name}-${i}`}>{f.name}</th>)}</tr></thead><tbody>{result.result.rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value === null ? <span className="null-value">NULL</span> : String(value)}</td>)}</tr>)}</tbody></table>{!result.result.rows.length && <p className="zero-rows">No rows returned.</p>}</div></> : <div className="empty-results"><Table2 size={27}/><strong>No results yet</strong><span>Ready for your query.</span></div>}
          </section>
          {activeTest ? <div className="checkpoint-actions"><button className="text-button" disabled={locked} onClick={() => submitTest(true)}>Skip question</button><button className="primary-button" disabled={locked || !result || resultQuery !== query} onClick={() => submitTest()}>{testIndex === 2 ? "Finish checkpoint" : "Submit answer"}<ArrowRight size={16}/></button></div> : <div className="exercise-footer"><span>{result?.correct ? current.explanation : ""}</span>{result?.correct && selectedId !== "p6" && <button className="text-button" onClick={() => choose(practice[practice.findIndex(e => e.id === selectedId) + 1])}>Next exercise<ArrowRight size={15}/></button>}</div>}
        </main>

        <aside className="support-sidebar">
          <div className="support-tabs" role="tablist" aria-label="Learning support"><button role="tab" aria-selected={rightTab === "coach"} disabled={!!activeTest} onClick={() => setRightTab("coach")}><Sparkles size={15}/>Coach</button><button role="tab" aria-selected={rightTab === "schema"} onClick={() => setRightTab("schema")}><Database size={15}/>Schema</button></div>
          {rightTab === "coach" && !activeTest ? <div className="coach-content"><div className="coach-avatar"><Sparkles size={23}/></div><h2>A little help.<br/>Your own solution.</h2><p className="subtle">{previousIndependent ? "You've solved this concept unaided. Start with an independent attempt." : "What would you try first?"}</p><div className="hint-ladder">{["Think it through", "Find the concept", "Shape the query"].map((label, i) => <div key={label} className={currentHelp.hints.length > i ? "used" : ""}><span>{currentHelp.hints.length > i ? <Check size={12}/> : i + 1}</span>{label}</div>)}</div>
            <div className="hint-messages" aria-live="polite">{currentHelp.hints.map((hint, i) => <div className="hint-message" key={i}><span className="eyebrow">Hint {i + 1} <span className="hint-provider">{hint.provider === "groq" ? "Groq AI" : "Authored"}</span></span><p>{hint.text}</p></div>)}</div>
            <button className="hint-button" onClick={() => void requestHint()} disabled={locked || currentHelp.hints.length >= 3 || (previousIndependent && !attempted)}>{hintBusy ? <LoaderCircle size={16} className="spin"/> : <Lightbulb size={16}/>} {currentHelp.hints.length >= 3 ? "All hints opened" : currentHelp.hints.length ? "One more hint" : "Give me a nudge"}</button>
            {!currentHelp.revealed ? <button className="solution-button" disabled={locked || currentHelp.hints.length < 3} onClick={() => setHelp(previous => ({ ...previous, [selectedId]: { ...currentHelp, revealed: true } }))}>View worked solution</button> : <div className="worked-solution"><span className="eyebrow">Worked solution</span><pre>{current.solution}</pre><p>{current.explanation}</p></div>}
            <div className="coach-note"><ShieldCheck size={16}/><span>{currentHelp.hints.length || currentHelp.revealed ? "This exercise is marked assisted." : "No help used on this exercise."}</span></div>
          </div> : <div className="schema-content"><div className="schema-title"><span className="eyebrow">Northstar Market</span><span className="subtle">Sample schema v1</span></div>{schema.map(table => <details className="schema-table" key={table.name} open><summary><Table2 size={15}/><strong>{table.name}</strong><span>{table.rows} rows</span></summary><div>{table.fields.map(([name, type, key]) => <div className="schema-field" key={name}><span>{key ? <KeyRound size={11}/> : <span className="field-dot"/>}<code>{name}</code></span><span>{type}{key && <b>{key}</b>}</span></div>)}</div></details>)}<div className="schema-relation"><span>customers.id</span><span className="relation-line"/><span>orders.customer_id</span></div><p className="schema-caption">1 customer : many orders</p><div className="schema-values"><h3>Order status</h3><code>fulfilled</code><code>pending</code><code>cancelled</code></div>{activeTest && <div className="assessment-lock"><LockKeyhole size={22}/><strong>Independent mode</strong><span>Coach and solutions are off.</span></div>}</div>}
        </aside>
      </div> : view === "assessment" ? <main className="full-view"><div className="section-heading"><div><span className="eyebrow">The removal test</span><h1>What stays when help goes?</h1><p>Two checkpoints. Three concepts. No coach.</p></div><ShieldCheck size={38}/></div><div className="checkpoint-grid">{([{ phase: "pretest" as const, title: "Your starting point", label: "Before practice", score: before, copy: "Filtering, joins, and aggregation. Establish an unaided baseline." }, { phase: "posttest" as const, title: "Your independent check", label: "After practice", score: after, copy: "New questions on the same concepts. Immediate transfer, not delayed retention." }]).map(({ phase, title, label, score, copy }) => <section className="checkpoint-card" key={phase}><span className="eyebrow">{label}</span><h2>{title}</h2><p>{copy}</p><div className="checkpoint-facts"><span><LockKeyhole size={15}/>No hints</span><span>3 questions</span></div>{score.complete ? <div className="completed-score"><CheckCheck size={20}/>{score.correct} / {score.total} correct</div> : <button className="primary-button" disabled={!loaded || (phase === "posttest" && !before.complete)} onClick={() => beginTest(phase)}>Begin checkpoint<ArrowRight size={16}/></button>}</section>)}</div><div className="study-note"><FlaskConical size={24}/><div><h3>Retention is a separate measurement</h3><p>The study protocol includes an unaided retest 48-72 hours later. Completing an immediate checkpoint does not establish lasting learning.</p></div></div></main> : <main className="full-view evidence-view"><div className="section-heading"><div><span className="eyebrow">Your session</span><h1>Evidence, not just completion.</h1><p>Device-local prototype records. No population-level claims.</p></div><button className="secondary-button" onClick={() => download("learning-os-session.csv", csvExport(sessionAttempts), "text/csv") } disabled={!sessionAttempts.length}><ArrowDownToLine size={16}/>Export session</button></div><div className="participant-row"><label htmlFor="participant-code">Participant code</label><input id="participant-code" value={participant} maxLength={32} disabled={!!sessionAttempts.length} onChange={e => setParticipant(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}/><span className="muted">{participant === "demo" ? "Demonstration session" : "Pseudonymous session"}</span><button className="icon-button" title="Start new session" aria-label="Start new session" onClick={newSession}><RotateCcw size={17}/></button></div><div className="metric-strip"><div><span>Practice completed</span><strong>{solvedIds.size}<small> / 6</small></strong></div><div><span>Solved without help</span><strong>{independentIds.size}<small> / 6</small></strong></div><div><span>Pre-checkpoint</span><strong>{before.complete ? `${before.correct}/3` : "Pending"}</strong></div><div><span>Post-checkpoint</span><strong>{after.complete ? `${after.correct}/3` : "Pending"}</strong></div></div><div className="evidence-bottom"><section><h2>Attempt history</h2>{sessionAttempts.length ? <div className="history-table"><table><thead><tr><th>Exercise</th><th>Phase</th><th>Support</th><th>Outcome</th></tr></thead><tbody>{sessionAttempts.toReversed().map(a => <tr key={a.id}><td>{exercises.find(e => e.id === a.exerciseId)?.title}</td><td>{a.phase}</td><td>{a.assisted ? "Assisted" : "Unaided"}</td><td><span className={a.correct ? "outcome-success" : "muted"}>{a.correct ? "Correct" : "Not yet"}</span></td></tr>)}</tbody></table></div> : <div className="empty-history"><FlaskConical size={28}/><h3>No attempts recorded</h3><p>Your results will appear after a query runs.</p></div>}</section><aside className="research-status"><h2>Study readiness</h2><div><Circle size={14}/><span>External learner study<strong>Not run</strong></span></div><div><Circle size={14}/><span>Answer-giving AI comparison<strong>Not run</strong></span></div><div><Circle size={14}/><span>48-72 hour retention test<strong>Pending</strong></span></div><div><Circle size={14}/><span>Course schema + Supabase<strong>Integration pending</strong></span></div></aside></div><footer className="evidence-footer"><span>{attempts.length} records retained on this device</span><button className="text-button" disabled={!attempts.length} onClick={() => download("learning-os-all-records.json", JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), attempts }, null, 2), "application/json")}><ArrowDownToLine size={15}/>Export all records</button></footer></main>}
      <footer className="app-footer"><span>Learning OS <span className="footer-dot"/> Assisted Independence</span><span>Course schema integration pending</span></footer>
    </div>
  );
}
