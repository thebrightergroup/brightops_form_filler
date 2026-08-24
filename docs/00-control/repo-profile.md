# Repository Profile

| Field | Value |
|---|---|
| Repo name | `brightops_form_filler` |
| Owner | The Brighter Group |
| Primary lead | Gary McCourt |
| Status | Active build |
| Governance mode | Advisory |
| CAB requirement | Review required before production/client-facing release |
| Parent product / engine | BrightOps |
| Repo category | Tool / App |

## Purpose

This repository owns the standalone-first implementation of **BrightOps Document Forms / Form Filler**: a browser-based tool for importing, detecting, editing, filling and exporting PDF form fields, with a planned path into BrightOps Documents and eSign workflows.

## Scope

This repo owns:

- the Form Filler web application and backend gateway
- native PDF form-field import and overlay handling
- AI-assisted detection of missing form input areas
- local document persistence for the Phase 1 MVP
- form completion, preview and export logic
- authentication/prefill prototype work that belongs specifically to this tool
- tool-specific release, test and implementation evidence

## Out of scope

This repo does not own:

- BrightOps cross-product architecture or company-wide standards
- Build Control governance rules
- canonical Brighter Group company knowledge
- production BrightOps identity, permissions or shared document storage until separately approved
- a regulated eSignature service

## Product boundary

Form Filler is a **BrightOps tool**, not a BrightOps engine. It may operate standalone during Phase 1, then integrate with BrightOps Documents, internal data mapping and eSign capability in later governed phases.

`Integrated Workflow Tools` may be used as a documentation grouping for cross-workflow tools. It is not a product or engine identity.

## Related repos

| Repo | Relationship |
|---|---|
| `thebrightergroup/brightops` | Parent BrightOps platform and roadmap context |
| `thebrightergroup/Build-Control` | Build intake, CAB and delivery governance |
| `thebrightergroup/brighter-group-control` | Cross-project standards and approved company knowledge |
| `thebrightergroup/github-control-index` | Repository inventory and governance visibility |

## Source-of-truth position

GitHub is the technical source of truth for this implementation repo once a build has been intentionally synchronised and reviewed.

Google AI Studio may be used as an implementation environment, but an unsynchronised AI Studio checkpoint is not canonical repository state.

Cross-project standards and approved company knowledge belong in `thebrightergroup/brighter-group-control`.

## Current controls and known limitations

- Phase 1 local persistence uses IndexedDB; this is device/browser local, not shared BrightOps storage.
- Google/Firebase authentication is currently a prototype boundary. Client-side allow-listing is not sufficient for protected server/cloud data access; server/Firebase-side authorisation is required before shared production data is introduced.
- Reusable signature images or dedicated signature values must not be stored in browser profile storage.
- Native AcroForm field names must be preserved separately from BrightOps machine names for reliable editable-PDF export.
- The AI Studio export referenced Firebase project `brightsites-mini`; this configuration is not accepted as canonical Form Filler configuration. The repo uses environment-based Firebase values pending confirmation of the correct project.
- Google Cloud build logs are not currently evidenced in this repository through GitHub Actions. Build-log integration remains to be verified/configured.
