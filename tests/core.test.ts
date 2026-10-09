import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { exercises, seedSQL, mutationSQL } from "../lib/curriculum";
import { compareResults, prepareReadQuery } from "../lib/evaluation";
import type { QueryResult } from "../lib/evaluation";
import { csvExport, phaseScore } from "../lib/study";
import type { Attempt } from "../lib/study";

const result = (rows: unknown[][], type = 23): QueryResult => ({ fields: [{ name: "n", dataTypeID: type }], rows });
test("comparison preserves duplicates and distinguishes NULL", () => {
  assert.equal(compareResults(result([[1], [1]]), result([[1], [2]]), false).correct, false);
  assert.equal(compareResults(result([[null]]), result([[0]]), true).correct, false);
});
test("ordered answers reject incorrect ordering, unordered answers allow it", () => {
  assert.equal(compareResults(result([[2], [1]]), result([[1], [2]]), true).correct, false);
  assert.equal(compareResults(result([[2], [1]]), result([[1], [2]]), false).correct, true);
});
test("numeric normalization is exact for large integers and money", () => {
  assert.equal(compareResults(result([["1200.00"]], 1700), result([[1200]], 23), true).correct, true);
  assert.equal(compareResults(result([["9007199254740993"]], 20), result([["9007199254740992"]], 20), true).correct, false);
  assert.equal(compareResults(result([["001"]], 25), result([[1]], 23), true).correct, false);
});
test("output aliases are part of the answer contract", () => {
  assert.equal(compareResults({ fields: [{ name: "wrong", dataTypeID: 23 }], rows: [[1]] }, result([[1]]), true).correct, false);
});
test("input guard rejects multiple statements and writes", () => {
  assert.equal(prepareReadQuery(" SELECT 1; "), "SELECT 1");
  assert.throws(() => prepareReadQuery("SELECT 1; DROP TABLE orders;"));
  assert.throws(() => prepareReadQuery("DELETE FROM orders"));
  assert.throws(() => prepareReadQuery(""));
});
test("incomplete checkpoints are not reported as complete", () => {
  const score = phaseScore([], "pretest");
  assert.deepEqual(score, { complete: false, answered: 0, correct: 0, total: 3 });
});
test("CSV escapes spreadsheet formulas and quotation marks", () => {
  const item = { participant: "=DANGEROUS()", query: 'SELECT "id"' } as Attempt;
  const csv = csvExport([item]);
  assert.ok(csv.includes("'=DANGEROUS()"));
  assert.ok(csv.includes('SELECT ""id""'));
});
test("all 12 reference queries run against both real PostgreSQL fixtures", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(seedSQL);
    assert.equal((await db.query("SELECT * FROM customers")).rows.length, 12);
    assert.equal((await db.query("SELECT * FROM orders")).rows.length, 24);
    for (const exercise of exercises) {
      const output = await db.query<unknown[]>(exercise.solution, [], { rowMode: "array" });
      assert.deepEqual(output.fields.map(f => f.name), exercise.columns, exercise.id);
      assert.ok(output.rows.length > 0, exercise.id);
    }
    const leftJoin = exercises.find(e => e.id === "p4")!;
    const counted = await db.query<{ customer_id: number; order_count: number }>(leftJoin.solution);
    assert.equal(Number(counted.rows.find(r => r.customer_id === 11)?.order_count), 0);
    await db.exec(mutationSQL);
    for (const exercise of exercises) {
      const output = await db.query<unknown[]>(exercise.solution, [], { rowMode: "array" });
      assert.deepEqual(output.fields.map(f => f.name), exercise.columns, `mutated ${exercise.id}`);
    }
    const antiJoin = await db.query<{ id: number }>(exercises.find(e => e.id === "t2")!.solution);
    assert.ok(antiJoin.rows.some(row => row.id === 9));
  } finally { await db.close(); }
});
test("read-only transaction rejects write CTEs and leaves fixture unchanged", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(seedSQL);
    await assert.rejects(() => db.transaction(async tx => {
      await tx.exec("SET TRANSACTION READ ONLY;");
      await tx.query("WITH removed AS (DELETE FROM orders RETURNING *) SELECT * FROM removed");
    }));
    assert.equal((await db.query("SELECT * FROM orders")).rows.length, 24);
  } finally { await db.close(); }
});
