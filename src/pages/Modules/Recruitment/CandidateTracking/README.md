# Candidate Pipeline (Candidate Tracking)

Recruitment › Entries › **Candidate Tracking** — `appl_name = CandidateTracking`
Spec: "09 - Candidate Pipeline" (Ref LI/HR/TM/04/009)

## Files

| File | Purpose |
|---|---|
| `CandidateTracking.jsx` | Page shell registered in `PageRegistry.js`. Switches between list and detail inside the same tab. |
| `PipelineList.jsx` | Screen 1 — KPI cards, "Pipeline by Stage" strip, filter bar, server-paged table. |
| `PipelineDetail.jsx` | Screen 2 — header card, stage stepper, current status, update-status form, history timeline, dispatch log. |
| `AddToPipelineModal.jsx` | "Add to Pipeline": pick a registered candidate + vacancy. |
| `components/PipelineProgressBar.jsx` | **Reusable** 7-segment progress bar. |
| `components/StageStepper.jsx` | **Reusable** 7-step stepper with connecting line. |
| `components/StatusChip.jsx` | Unique-status chip in category colour. |
| `pipelineConstants.js` | Stages, category colour map, date/format helpers. |

API: `Finaman-API/routes/recruitment/pipelineRoutes.js` mounted at `/api/recruitment/pipeline`
(separate file — `recruitmentRoutes.js` is untouched). Client functions are in `src/utils/recruitmentApi.js`.

## Reused (existing components / tokens)

- `Table` (`components/Reusable/table`) — list grid, search, sort, column tools, paging (`serverPagination`), `formComponent` slot for KPI/filters, `actions` column.
- `ERPHeader`, `ERPFooter`, `AddButton`, `DiscardButton` — page header and Save / Cancel bar (Alt+S / Esc).
- `SectionCard`, `FormField`, `formInputClass` — section panels, labels, required marker, error style.
- `ERPFormModal` — Add to Pipeline dialog.
- `showToast`, `alertError` — feedback.
- `getRights(appl_name)` — add / modify permissions.
- Theme tokens: `var(--icon-color)`, `var(--accent-soft)` for the primary accent; Tailwind palette already used in the module for categories (blue = Active, amber = Comm Pending, emerald = Milestone, rose = Terminal). System font from `index.css`.
- History timeline follows the left-border/dot pattern in `JobVacancyApproval.jsx`; stepper follows the QMS `WorkflowProgressBar` / `FormSidebar` stage idea.

## Newly created

- `PipelineProgressBar`, `StageStepper`, `StatusChip`, the two screens, the modal, `pipelineConstants.js`.
- API tables (auto-created per tenant on first call, seeded idempotently):
  `rec_pipeline_status_master` (52 statuses), `rec_pipeline_transition_map` (102 moves),
  `rec_rejection_reason_master`, `rec_candidate_pipeline`, `rec_pipeline_status_history`,
  `rec_pipeline_communication_log`.

## Business rules implemented (server-side)

- Transitions validated against the map; terminal statuses are locked.
- Call attempts: Raw Data max 3, Round 1/2/Final max 2 — the limit auto-sets `Rejected - <Stage> - No Communication` (history row marked System).
- "Not Interested" / "Offer Declined" require a reason; it is embedded in the status name.
- "Interview Scheduled" / "Rescheduled" / "Callback Scheduled" require a date & time.
- Every change writes `rec_pipeline_status_history`.
- Statuses with a template write rows to `rec_pipeline_communication_log` (status `Queued`).
- "Offer Declined" / "Joining - No Show" reopen the vacancy; "Joined" increments `filled_positions`.
- Legacy `rec_candidate_master.pipeline_status` is kept loosely in sync so the Registration grid still makes sense.

## Not done / hooks

- **Sending** (Email / SMS / WhatsApp): no service exists yet — log rows stay `Queued`. Plug a sender into `POST /:id/status` where the log rows are written.
- **Employee Master creation on "Joined"**: `TODO(employee-master)` in `pipelineRoutes.js`. Only the inline `POST /api/employee/actled` handler exists; no reusable service.
- **Board view**: disabled placeholder toggle.
- **Screening Sheet / Assessment Score** buttons: those modules do not exist yet, so they are not rendered.
- Menu tile: menus come from `MASMNU`. The "Candidate Tracking" row's `appl_name` must be `CandidateTracking` for the tile to open this page.
