import { PGlite } from "@electric-sql/pglite";
import { exercises, seedSQL, mutationSQL } from "../lib/curriculum";
import { compareResults, prepareReadQuery } from "../lib/evaluation";
import type { QueryResult } from "../lib/evaluation";

self.onmessage = async (event: MessageEvent<{ exerciseId: string; query: string; seed?: string }>) => {
  let db: PGlite | undefined;
  try {
    const exercise = exercises.find(item => item.id === event.data.exerciseId);
    if (!exercise) throw new Error("Unknown exercise.");
    const query = prepareReadQuery(event.data.query);
    const started = performance.now();
    db = await PGlite.create();
    if (event.data.seed && event.data.seed !== seedSQL) throw new Error("Dataset version does not match this curriculum.");
    await db.exec(event.data.seed || seedSQL);
    const execute = async (sql: string): Promise<QueryResult> => db!.transaction(async tx => {
      await tx.exec("SET TRANSACTION READ ONLY; SET LOCAL statement_timeout = '3000ms';");
      const result = await tx.query<unknown[]>(sql, [], { rowMode: "array" });
      if (result.rows.length > 500) throw new Error("Result exceeds 500 rows. Narrow the query.");
      return { fields: result.fields, rows: result.rows };
    });
    const expected = await execute(exercise.solution);
    const result = await execute(query);
    let verdict = compareResults(result, expected, exercise.ordered);
    if (verdict.correct) {
      await db.exec(mutationSQL);
      const secondExpected = await execute(exercise.solution);
      const secondActual = await execute(query);
      verdict = compareResults(secondActual, secondExpected, exercise.ordered);
      if (!verdict.correct) verdict.reason = "The sample result matches, but the query fails on changed data. Check boundaries and hard-coded values.";
    }
    self.postMessage({ result, ...verdict, durationMs: Math.round(performance.now() - started) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "The query could not run." });
  } finally { await db?.close(); }
};
