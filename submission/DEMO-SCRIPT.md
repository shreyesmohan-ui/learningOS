# Demo: Can You Still Solve It Without the Coach?

**Target length: 3 minutes. Status: script, not a recorded video.**

## Before recording

- Run a clean browser session at desktop size, without personal tabs or keys visible.
- Open the Vercel demo: https://learning-os-sql-studio.vercel.app
- Confirm a real SQL query runs and the output is visible.
- Keep the prototype label and synthetic dataset label visible.
- Do not fabricate a pre/post improvement or populate mock learner metrics.
- Open the Evidence screen once to ensure study gaps remain explicit.

| Time | Screen / action | Narration |
| --- | --- | --- |
| 0:00-0:20 | Practice workspace, clear title | "Most AI tutors can help you finish a question. My capstone asks a harder question: can you solve the next one when the help disappears? This is Learning OS, a SQL learning prototype." |
| 0:20-0:40 | Schema tab; customers and orders | "The current demonstration uses two synthetic tables. These are not the course-supplied schema. The SQL engine is PostgreSQL running in an isolated browser worker." |
| 0:40-1:05 | Run SELECT id, name FROM customers ORDER BY id; on the Bengaluru task | "This query runs, but it does not answer the task. Correctness comes from comparing result sets, including column names, rows, duplicates, and ordering." |
| 1:05-1:30 | Request one nudge, add WHERE city = 'Bengaluru', run again | "The first hint is conceptual. More help becomes progressively specific, and any helped attempt is marked assisted. Without a configured AI key, these are authored hints, as labelled." |
| 1:30-1:55 | Open checkpoint, show hints disabled; run and submit one question | "An independent checkpoint removes the coach and uses different questions. Query execution remains available, but the score is withheld until completion. This is a low-stakes prototype, not a secure exam system." |
| 1:55-2:20 | Evidence view; assistance flags and CSV export | "Completion and independence are separate. Records include help use and timing. These are only this device's records, not evidence of a completed learner study." |
| 2:20-2:45 | Architecture diagram from ARCHITECTURE.md | "The model can propose a hint, but it never grades correctness. The next implementation milestone is the required course-schema and Supabase integration." |
| 2:45-3:00 | Study readiness | "The remaining validation is a real external-learner comparison against an answer-giving assistant, followed by an unaided retention check. I will report those results only after running them." |

## Recording checklist

- [ ] Voice is audible; no unrelated notifications.
- [ ] Cursor and query text are readable at 1080p.
- [ ] SQL result, hint, checkpoint, and evidence export are shown.
- [ ] No API key, personal learner data, or private course content is exposed.
- [ ] No claims exceed what is shown and measured.
- [ ] Uploaded video plays for a logged-out reviewer.
- [ ] Final video link added to START-HERE.md.
