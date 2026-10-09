export type QueryResult = { fields: { name: string; dataTypeID: number }[]; rows: unknown[][] };
const numericTypes = new Set([20, 21, 23, 700, 701, 1700]);
function cell(value: unknown, type: number): string {
  if (value === null) return "null";
  if (numericTypes.has(type)) {
    // Preserve large integers and exact money values without float conversion.
    const match = String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);
    if (match) {
      const whole = match[2].replace(/^0+(?=\d)/, "");
      const fraction = (match[3] ?? "").replace(/0+$/, "");
      const sign = whole === "0" && !fraction ? "" : match[1];
      return `number:${sign}${whole}${fraction ? "." + fraction : ""}`;
    }
  }
  if (value instanceof Date) return `date:${value.toISOString()}`;
  return `${typeof value}:${JSON.stringify(value)}`;
}
export function compareResults(actual: QueryResult, expected: QueryResult, ordered: boolean): { correct: boolean; reason: string } {
  const names = (result: QueryResult) => result.fields.map((field) => field.name);
  if (JSON.stringify(names(actual)) !== JSON.stringify(names(expected))) return { correct: false, reason: "Check the output columns and their aliases." };
  if (actual.rows.length !== expected.rows.length) return { correct: false, reason: `Your query returned ${actual.rows.length} rows. Recheck the filters, joins, and grouping.` };
  const canonical = (result: QueryResult) => result.rows.map(row => JSON.stringify(row.map((value, i) => cell(value, result.fields[i].dataTypeID))));
  const left = canonical(actual); const right = canonical(expected);
  if (!ordered) { left.sort(); right.sort(); }
  const correct = left.every((row, i) => row === right[i]);
  return { correct, reason: correct ? "The result matches on both datasets." : "The values or row order differ. Check edge cases and the requested sort order." };
}
export function prepareReadQuery(input: string): string {
  const query = input.trim().replace(/;\s*$/, "");
  if (!query || query.length > 12000) throw new Error("Enter a query of 1 to 12,000 characters.");
  // UX filter only. The boundary is an isolated worker and a read-only DB transaction.
  if (!/^(select|with)\b/i.test(query)) throw new Error("This workspace accepts SELECT queries and read-only CTEs.");
  if (query.includes(";")) throw new Error("Run one statement at a time. Semicolons inside strings are not supported.");
  return query;
}
