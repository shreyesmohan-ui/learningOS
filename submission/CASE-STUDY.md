# Learning OS: Building for the Moment the Help Disappears

**Draft for review | Shreyes Mohan | October 8, 2026**

> In prototype stage . Currently under trial will publish results once done.

## TL;DR

Learning OS is a SQL learning prototype built around a simple distinction: finishing a problem with assistance is not the same as being able to solve the next problem independently. The current source implements six practice exercises, graduated hints, separate unaided checkpoints, PostgreSQL result checking, and exportable attempt records. Its central design decision is to keep a model out of correctness grading. The prototype is incomplete: course-schema and Supabase integration, a deployed review link, and the required external-learner comparison are still outstanding. This submission presents the work and its limitations for review, not evidence of improved learning.

## The Problem and the Insight

An assistant can produce excellent SQL while leaving the learner unable to explain the query. A successful output then hides an unsuccessful learning experience. If a tutor measures only exercise completion, giving away the answer can look like good teaching.

The Learning OS brief changes the question. The important outcome is capability after help is removed. That calls for different product decisions: separate assisted and unaided success, expose how much help was used, and test a new problem without the assistant. A friendly conversation is not sufficient evidence.

My background in healthcare integration shaped the engineering approach. In integration work, a plausible message is not enough; the system must satisfy an explicit contract. I brought that preference for inspectable checks to SQL learning. This prototype uses synthetic retail data, not healthcare or patient information, so the domain connection is in the engineering discipline rather than the dataset.

## The Solution

The product is a working-source SQL workspace rather than a landing page. A learner sees an exercise, the expected output columns, an editable query, a results table, and either the schema or a coach panel. The practice sequence covers filtering, joins, and aggregation, including boundary dates, customers with no orders, and the difference between WHERE and HAVING.

Help is graduated. A learner can request a conceptual nudge, then a more specific concept, then a partial query direction. A worked solution is available after the hints. Opening help marks subsequent attempts on that exercise as assisted. After unaided success on a concept, the interface encourages an independent attempt before another hint.

The current default is authored guidance, explicitly labelled. An optional server-side Groq route can generate hints when a key is configured. No key is currently configured, so this draft does not describe the default experience as a live AI tutor. The fallback keeps the prototype inspectable without a paid API dependency.

## Architecture and Correctness

The interface uses React and TypeScript on the supplied Vinext starter. A disposable browser worker runs PGlite, a PostgreSQL engine, against a small synthetic fixture. The learner query is compared with a reference query's result, including column names, duplicate rows, values, and ordering.

When an answer matches the first fixture, the worker changes the sample data and checks it again. This catches some hard-coded outputs and boundary mistakes. It does not prove every possible query is correct, and the two fixtures are not a substitute for a larger test corpus.

The model never decides whether an answer is correct. It can propose a hint; the SQL engine supplies the execution evidence. The worker is terminated after the response or timeout. Read-only transactions reject ordinary writes, and the database contains only synthetic data.

```text
Learner query -> isolated PostgreSQL worker -> reference-result comparison
                                          -> changed-fixture comparison
Hint request -> server route -> Groq if configured / authored fallback
Attempt      -> device-local record -> CSV or JSON export
```

The required Supabase integration is not implemented in this snapshot. PGlite is the current prototype execution environment, not a claim that the official infrastructure requirement has been met.

## Build Journey

The main design decision was to separate three things that are easy to mix together: guidance, execution, and evidence. A hint should help the learner think. Execution should report what the database actually did. Evidence should say whether the learner used assistance, rather than treating every correct result equally.

Another important choice was to make gaps visible. The Evidence view marks the learner study, assistant comparison, delayed retention test, and course integration as pending. It begins empty instead of presenting invented improvement charts. This makes the demonstration less complete, but the review more honest.

Dependency installation and approval interruptions delayed verification, and the requested evening delivery target was missed. The immediate response is an incomplete review package with source and documentation. The correct next step is to finish verification and required integrations, not to rename a scaffold a finished product.

## Results and Metrics

There are no measured learning outcomes yet. No external learners have completed the study, and no improvement percentage, satisfaction score, or participant quotation is reported here.

The concrete implementation inventory is twelve authored questions: six practice tasks, three before-practice questions, and three after-practice questions. The sample database has twelve customers and twenty-four orders. TypeScript compilation passed for the app, and the PostgreSQL worker bundle was generated. Full browser verification and the newly added regression suite still need to run for this review snapshot.

The planned evaluation compares graduated support with an ordinary answer-giving assistant using the same model and tasks. It requires at least six genuine external learners, an unaided baseline, immediate transfer questions, and a separate 48-72 hour follow-up. A same-day posttest must not be described as lasting retention.

## Learnings and Next Steps

The strongest lesson so far is that learning claims require a different evidence standard from a polished demonstration. A correct query establishes task success. It does not establish understanding, transfer, or retention.

Next, I need to integrate the supplied course schema and Supabase, verify the complete workflow, implement the comparison condition, and recruit real learners. Assessment assignment and grading should become server-authoritative; the current browser-delivered solutions are inspectable and unsuitable for secure examinations.



Publication tags: @100xEngineers #0to100xEngineer
