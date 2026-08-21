# BrightOps Form Filler

BrightOps Form Filler is the standalone-first implementation of BrightOps Document Forms: a browser-based tool for importing, detecting, editing, filling and exporting PDF forms.

It is a **BrightOps tool**, not a BrightOps engine. Phase 1 is designed to work independently while preserving a path into BrightOps Documents, internal data mapping and eSign workflows later.

## Current Phase 1 capabilities

- upload PDF documents and supported images
- convert supported images to PDF
- import native AcroForm fields
- use AI to identify missing visual form-entry areas
- edit and manually add form fields
- fill documents in the browser
- save/reopen local documents using IndexedDB
- duplicate/reconnect handling using file fingerprints
- preview and export document output
- lightweight signature/initial field completion
- Google/Firebase sign-in prototype
- user-profile prefill suggestions for common fields

## Architecture principles

- Native PDF form structure is imported before AI detection.
- AI supplements missing input areas; it does not replace deterministic PDF parsing.
- Original PDF field names are preserved separately from BrightOps machine names.
- The source PDF is preserved; completed outputs are separate.
- Technical errors are secondary to plain-language user messages.
- Browser profile prefill stores ordinary reusable profile information only; reusable signature images/values are not profile data.
- Client-side login filtering is not treated as production authorisation for protected shared data.

## Current persistence

Phase 1 document storage is local to the browser using IndexedDB. This is appropriate for the current standalone MVP but does not provide cross-device or shared BrightOps document storage.

Server-side/shared storage belongs to a later governed BrightOps integration phase.

## AI

Gemini is called server-side through the application backend for visual field detection and form checks. Gemini is an analysis service, not the canonical document repository.

## Authentication

The current build includes Firebase/Google sign-in and an internal allow-list prototype. Production authorisation for shared/cloud data must also be enforced server-side and/or through Firebase security controls before that capability is treated as complete.

Firebase configuration must come from environment values for the approved Form Filler Firebase project. Do not copy configuration from unrelated BrightOps applications.

## Governance

Build Control references:

- Intake: `thebrightergroup/Build-Control#26`
- CAB approval: `thebrightergroup/Build-Control#27`

Current correction packet:

- `docs/02-build/CORRECTION-PACKET-01-PHASE1-ALIGNMENT.md`

Parent BrightOps architecture and roadmap context lives in:

- `thebrightergroup/brightops`

## Known Phase 1 release gates

The tool is still an active build. Release readiness requires:

- reliable editable-PDF export validation using original native AcroForm names
- Complete/Download runtime-path validation
- checkbox/radio/dropdown and multiline export tests
- signature behaviour validation
- build/typecheck evidence
- authentication/security-rule review before any shared protected data is introduced

## AI Studio → GitHub sync rule

Google AI Studio may be used to build and test rapidly. An AI Studio checkpoint is not automatically canonical source.

After each material build:

1. identify the AI Studio checkpoint/build;
2. compare it with the current GitHub branch;
3. apply required engineering/governance corrections;
4. run build/typecheck and targeted functional tests;
5. commit to a purpose-specific branch;
6. open/review the PR;
7. record build/deployment evidence and known warnings.

At present there are no GitHub Actions workflow runs associated with the imported repo commits. Google Cloud/Cloud Build log ingestion still needs to be verified before it is relied on as repository evidence.

## Run locally

Prerequisite: Node.js.

```bash
npm install
```

Configure the required environment values without committing secrets. `GEMINI_API_KEY` is required for Gemini analysis. Firebase uses the `VITE_FIREBASE_*` values shown in `.env.example`.

```bash
npm run dev
```

Build:

```bash
npm run build
```

Type check:

```bash
npm run lint
```

## Repository controls

- Do not commit API keys, passwords, tokens or private environment files.
- Use a purpose-specific branch and pull request for controlled changes.
- Keep tool-specific implementation in this repo.
- Keep cross-product governance and standards in the appropriate Brighter Group control repos.
- Do not describe Phase 2/3 roadmap scope as implemented capability.
