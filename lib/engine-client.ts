import type { QueryResult } from "./evaluation";
export type RunResult = { result: QueryResult; correct: boolean; reason: string; durationMs: number };

export function runSQL(exerciseId: string, query: string, seed?: string): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/sql-engine/worker.js", { type: "module" });
    const end = () => { clearTimeout(timeout); worker.terminate(); };
    const timeout = setTimeout(() => { end(); reject(new Error("The query exceeded 30 seconds. Simplify it and try again.")); }, 30000);
    worker.onerror = () => { end(); reject(new Error("The PostgreSQL engine is not available. Engine setup must be completed before queries can run.")); };
    worker.onmessage = (event: MessageEvent<RunResult & { error?: string }>) => {
      end();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.postMessage({ exerciseId, query, seed });
  });
}
