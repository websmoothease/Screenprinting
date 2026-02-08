# Naughty Control Automation Dashboard Spec Pack

This repository now includes both:

1. **Implementation specs** (API/state/config/contracts)
2. **A visual dashboard MVP** (`dashboard/`) with CRUD plumbing for lead management

## Included artifacts

- `specs/openapi.yaml`: REST API contract for leads, interactions, payments, scheduling, approvals, forecasts, and agent health.
- `specs/state-transitions.md`: event-driven state transition table for the lead lifecycle.
- `specs/campaign-config.json`: configurable campaign definitions for HOT, PREDICTIVE, COOLING, and DORMANT tracks.
- `specs/schemas/`: JSON Schemas for core entities.
- `dashboard/index.html`: visual dashboard shell + lead CRUD screen.
- `dashboard/styles.css`: responsive UI styling.
- `dashboard/api.js`: local CRUD service abstraction (list/create/update/delete), normalization, and duplicate checks.
- `dashboard/app.js`: screen logic wired to `api.js`, filtering, lanes/KPI rendering, and controls.

## Run the visual dashboard locally

```bash
cd /workspace/Screenprinting
python -m http.server 4173
# then open http://localhost:4173/dashboard/
```

## Notes

- The dashboard is a front-end MVP with mock queue/approvals/agents and localStorage-backed CRUD service plumbing for leads.
- Next step is replacing localStorage plumbing with real API calls to `specs/openapi.yaml` endpoints.
