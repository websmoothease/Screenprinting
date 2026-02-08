# Lead State Transition Table (v1)

| Event | From State | To State | Guard / Condition | Actions |
|---|---|---|---|---|
| Declared buy date set within 72h | ANY except DO_NOT_CONTACT | HOT_DATE_BOUND | Buy date exists and now +72h >= date | Cancel non-hot queued actions, schedule hot track |
| Payment recorded | DORMANT / COOLING / PREDICTIVE_SOON | PREDICTIVE_SOON | No declared buy date in next 72h | Recompute cadence, schedule predictive track |
| Inbound positive intent with explicit date | ANY except DO_NOT_CONTACT | HOT_DATE_BOUND | Parsed intent confidence >= threshold | Update declared_buy_date, schedule hot track |
| Predicted window enters next 72h | PREDICTIVE_SOON | HOT_DATE_BOUND | Confidence >= 0.6 and overlap with 72h | Promote urgency lane and queue nudges |
| Missed expected buy window | HOT_DATE_BOUND / PREDICTIVE_SOON | COOLING | Window end elapsed and no payment | Schedule cooling track |
| No inbound reply for cooling threshold | COOLING | DORMANT | Inactive > 10 days and no payment | Schedule dormant long-drip |
| New inbound message after dormancy | DORMANT | PREDICTIVE_SOON | Message received and DNC not set | Resume predictive campaign |
| Explicit stop / boundary / risk escalation | ANY | DO_NOT_CONTACT | Manual set or classifier confidence >= threshold | Cancel all queued actions, block sending |
| Manual unpause from DNC | DO_NOT_CONTACT | COOLING | Supervisor override | Require approval mode, schedule limited cooling |
| Manual override set | ANY | SAME | manual_override_until in future | Pause rescheduler except critical safety tasks |

## Notes

- `DO_NOT_CONTACT` is terminal for automation until manual supervisor override.
- Daily scheduler should re-evaluate transitions idempotently and honor dedupe keys.
- Transition events must produce audit log entries (`actor`, `old_state`, `new_state`, `reason`).
