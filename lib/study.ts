import { z } from "zod";
import { exercises } from "./curriculum";
import type { Phase } from "./curriculum";
export const attemptSchema = z.object({
  id: z.string(), session: z.string(), participant: z.string().max(32),
  exerciseId: z.string(), phase: z.enum(["practice", "pretest", "posttest"]),
  correct: z.boolean(), hints: z.number().int().min(0), revealed: z.boolean(),
  assisted: z.boolean(), elapsedMs: z.number().min(0), timestamp: z.string(),
  provider: z.enum(["none", "authored", "groq"]), query: z.string().max(12000),
  kind: z.literal("device-local-prototype"),
  condition: z.enum(["coached", "answer_first"]).default("coached"),
  model: z.string().nullable().default(null),
  datasetId: z.string().default("northstar-v1"),
  promptVersion: z.string().default("coach-v1"),
});
export type Attempt = z.infer<typeof attemptSchema>;
export const attemptsSchema = z.array(attemptSchema).max(5000);
export function phaseScore(attempts: Attempt[], phase: Phase) {
  const expected = exercises.filter(e => e.phase === phase);
  const latest = new Map(attempts.filter(a => a.phase === phase).map(a => [a.exerciseId, a]));
  return {
    complete: expected.every(e => latest.has(e.id)), answered: expected.filter(e => latest.has(e.id)).length,
    correct: expected.filter(e => latest.get(e.id)?.correct && !latest.get(e.id)?.assisted).length,
    total: expected.length,
  };
}
export function csvExport(attempts: Attempt[]): string {
  const headers: (keyof Attempt)[] = ["id", "session", "participant", "condition", "exerciseId", "phase", "correct", "hints", "revealed", "assisted", "elapsedMs", "timestamp", "provider", "model", "datasetId", "promptVersion", "kind", "query"];
  const quote = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [headers.join(","), ...attempts.map(attempt => headers.map(key => quote(attempt[key])).join(","))].join("\r\n");
}
