# Naughty Control Automation Dashboard Spec Pack

This repository now includes both:

1. **Implementation specs** (API/state/config/contracts)
2. **A visual dashboard MVP** (`dashboard/`) that demonstrates the control-tower layout and interactions

## Included artifacts

- `specs/openapi.yaml`: REST API contract for leads, interactions, payments, scheduling, approvals, forecasts, and agent health.
- `specs/state-transitions.md`: event-driven state transition table for the lead lifecycle.
- `specs/campaign-config.json`: configurable campaign definitions for HOT, PREDICTIVE, COOLING, and DORMANT tracks.
- `specs/schemas/`: JSON Schemas for core entities.
- `dashboard/index.html`: visual dashboard shell.
- `dashboard/styles.css`: responsive UI styling.
- `dashboard/app.js`: sample-data-driven dashboard interactions (filters, lanes, approvals, kill switch toggle).

## Run the visual dashboard locally

```bash
cd /workspace/Screenprinting
python -m http.server 4173
# then open http://localhost:4173/dashboard/
```

## Notes

- The dashboard is a front-end MVP with mock data, intended as the concrete visual baseline.
- Next step is wiring `dashboard/app.js` to real API endpoints from `specs/openapi.yaml`.
