# Decision Log

| Field | Value |
|---|---|
| Repo | `brightops_form_filler` |
| Status | Active |

## Decision log

| Date | Decision | Owner | Status | Link |
|---|---|---|---|---|
| 2026-08-09 | Form Filler Phase 1 standalone-first direction approved; Phase 2/3 documented as future scope. | Gary McCourt | Approved | `thebrightergroup/Build-Control#27` |
| 2026-08-21 | `thebrightergroup/brightops_form_filler` is the implementation repository for the standalone Form Filler tool. | Gary McCourt | Approved | This repo |
| 2026-08-21 | Preserve native PDF field names separately from BrightOps machine names and use native names when writing editable AcroForm output. | Gary McCourt | Approved | Correction Packet 01 |
| 2026-08-21 | Browser profile prefill may store ordinary user profile data, but must not store reusable signature images or a dedicated reusable signature value. | Gary McCourt | Approved | Correction Packet 01 |
| 2026-08-21 | Heuristic profile prefill is a Phase 1 convenience layer, not the canonical future BrightOps data-mapping model. | Gary McCourt | Approved | Correction Packet 01 |
| 2026-08-21 | Client-side email/domain filtering is not a production authorisation boundary. Server/Firebase-side enforcement is required before protected shared data is introduced. | Gary McCourt | Approved | Correction Packet 01 |
| 2026-08-21 | Do not adopt the AI Studio-exported `brightsites-mini` Firebase configuration as Form Filler canonical configuration; use environment-driven configuration pending confirmation of the approved Firebase project. | Gary McCourt | Approved | Correction Packet 01 |

## Notes

Use this file for repo-level implementation decisions. Cross-project product and governance decisions must also be reflected in the appropriate control repository.
