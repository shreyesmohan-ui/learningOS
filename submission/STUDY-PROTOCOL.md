# A Small, Honest Test of Assisted Independence

**Status: protocol only. No learners have been run through this study.**

## Hypothesis

Graduated hints improve unaided transfer relative to an ordinary answer-giving assistant, without making practice completion materially worse. This is a hypothesis, not a result.

## Participants and consent

- Minimum: six real learners, outside the team and classmates, as required by the course brief/FAQ.
- Prefer twelve for a less fragile pilot. With six, report descriptive results, not a strong causal claim.
- Recruit people who know basic tables but are still learning joins and aggregation.
- Explain the study, voluntary participation, data collected, and deletion option.
- Use codes such as P001. Keep contact details in a separate private file, never the public repository.
- Do not use patient, employer, or other confidential data. The current fixture is synthetic.

## Comparison conditions

| Condition | Support |
| --- | --- |
| A: Learning OS | Graduated hints, independent attempt encouraged after demonstrated unaided success |
| B: Ordinary assistant | Same model and tasks, allowed to provide complete SQL answers |

Use the same model, schema, task order, practice duration, and token budget in both arms. Without a live model in both arms, label the pilot as authored-material usability testing, not the required AI comparison.

## Procedure

1. Record prior SQL experience and consent.
2. Run a three-question unaided pretest before exposing practice content.
3. Randomize participants to A/B, balancing prior experience where feasible. With six, this is only three per group.
4. Allow 20 minutes of practice with the assigned support. Record attempts, errors, hint levels, reveals, and completion.
5. Run an immediate unaided posttest on new questions. No external assistant or search.
6. Optional extension: run a second unaided transfer test 48-72 hours later with unseen questions. The course brief requires a removal test but does not prescribe this delay. Do not reuse the visible posttest.
7. Ask what they understood, where help was excessive, and what they could explain without the tool.

The prototype has pre/post UI, but study randomization, the ordinary-assistant arm, and delayed test still need implementation or a documented facilitator procedure. Pre/post task difficulty is not calibrated; treat raw differences cautiously.

## Measures

- Primary: unaided accuracy on held-out removal-test tasks. Optional extension: delayed unaided accuracy.
- Secondary: immediate unaided accuracy, practice completion, time per task, help requests, answer reveals.
- Report learner-level results and group summaries. Distinguish assisted practice success from unaided success.
- Use the final submitted answer for each assessment item. Do not average all attempts as if they were independent observations.
- Mark missing follow-ups missing, not zero, and report attrition.
- Do not mix demo, author, or repeated-device sessions with external participant evidence.

## Analysis table (blank intentionally)

| Participant | Condition | Prior SQL | Pretest | Practice completion | Assisted solves | Immediate posttest | Delayed posttest | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P001 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P002 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P003 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P004 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P005 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| P006 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Go / no-go interpretation

A successful implementation is not a successful learning intervention. A negative pilot result is useful if it changes the design. Report the actual direction and uncertainty; do not substitute satisfaction for unaided performance.

## Deadline constraint

A new 48-72 hour retention study cannot be completed before a deadline less than 48 hours away. Ask the course team whether later follow-up evidence can supplement the submission. Do not backdate sessions or claim a same-day check measures retention.
