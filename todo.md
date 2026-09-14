# Project TODO

- [x] Establish the RFQ operations app shell with persistent sidebar navigation and polished visual system
- [x] Build operational dashboard with pipeline totals, priority work, quote progress, KPIs, and recent RFQ table
- [x] Build RFQ inbox with search, filters, upload/dropzone affordance, manual entry affordance, and status/risk tracking
- [x] Build RFQ review workspace with source-document preview, editable extracted fields, line items, confidence labels, and missing-information flags
- [x] Build requirements checklist with compliance decisions, exceptions, internal notes, and review readiness
- [x] Build clarification workflow with draft/edit/copy/mark-sent/cancel interactions and tracking states
- [x] Build quotation builder with customer details, editable line items, commercial terms, calculations, and quote release controls
- [x] Build analytics view with RFQ volume, turnaround time, quote value, win rate, and bottleneck visualizations
- [x] Build notifications center for new RFQs, assignments, missing information, approaching deadlines, and quote milestones
- [x] Add relational schema for RFQ records, items, requirements, documents, assignments, clarifications, quotes, quote items, tasks, notifications, and activity
- [x] Add tRPC procedures and data helpers for RFQ workflow records and mutations
- [x] Add LLM extraction integration using structured RFQ data and explicit no-fabrication behavior
- [x] Add S3-backed document upload and record association workflow
- [x] Add automated owner/assignee notification support
- [x] Add Vitest coverage for core RFQ workflow calculations and validation
- [x] Run typecheck, tests, and visual verification; fix issues
- [x] Save final project checkpoint for delivery

## History

- Initial project scope captured from user brief and follow-up requirements.
- [x] User requested an elegant, polished style refinement.
- [x] User requested LLM extraction, secure file association, and automated notifications.

- [x] Add interactive compliance decisions, exception logging, internal notes, and review-readiness controls to the RFQ detail workspace
- [x] Add a complete clarification editor with draft, copy, mark-sent, resolve, and cancel states
- [x] Connect RFQ detail actions to backend mutations for clarification and status updates
- [x] Add executable RFQ workspace integration coverage for clarification state transitions

- [x] Implement real scheduled deadline notification automation using the platform heartbeat pattern
- [x] Route missing-information and quote-milestone notifications to the RFQ owner or assignee and test those recipient rules

- [x] Connect dashboard and inbox summaries to persisted RFQ records with graceful empty and loading states

- [x] Connect quote studio save-draft and release-readiness interactions to persisted quote records

- [x] Create and persist a real Heartbeat cron for RFQ deadline alerts with an owner-level task UID and schedule lifecycle mutation
- [x] Replace dashboard fallback-on-empty behavior with explicit live empty states
- [x] Implement persisted quote release-readiness checks and a quote release mutation

- [x] Create and verify the project-owner Heartbeat deadline cron with durable task UID lifecycle
- [x] Replace remaining dashboard demo pipeline and priority summaries with live-derived values or explicit empty states

- [x] Execute and verify the owner-level Heartbeat deadline schedule lifecycle
- [x] Finish live pipeline stage percentages and pricing-stage derivation
