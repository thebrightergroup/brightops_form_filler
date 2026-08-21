# Correction Packet 01 — Phase 1 Alignment

**Product:** BrightOps Form Filler / Document Forms  
**Repository:** `thebrightergroup/brightops_form_filler`  
**Date:** 21 August 2026  
**Authority:** Gary McCourt — Product Owner / Build Controller  
**Governance references:** Build Control intake #26; CAB #27  
**Change type:** Corrective implementation and repository alignment

## Purpose

Bring the latest Google AI Studio build back into the approved Phase 1 architecture without discarding useful authentication and profile-prefill work.

This is a bounded correction packet. It is not authority for broad Phase 2 production integration.

## Current position

The latest AI Studio checkpoint adds Firebase/Google authentication and browser-based user-profile prefilling. The implementation repository is behind that checkpoint and its README/control files are still partly generic.

The current PDF export implementation also transforms native PDF field names into BrightOps-style machine names and then attempts to use those transformed names to address native AcroForm controls. That can break editable-PDF output.

The AI Studio export also contains Firebase configuration pointing to project `brightsites-mini`. That is not accepted as canonical Form Filler configuration without explicit confirmation.

## Required corrections

### 1. Preserve native PDF identity

For each imported native PDF field, persist both:

- `machineName` — BrightOps/internal stable key
- `originalPdfFieldName` — exact native AcroForm field name

Do not overwrite one with the other.

Editable native-PDF export must address AcroForm controls using `originalPdfFieldName` where available.

`machineName` remains available for BrightOps mapping, templates and future APIs.

### 2. Export behaviour

For non-flattened export:

- use the original native PDF field name
- support text, multiline, date, email, phone, number and currency text fields
- support checkboxes
- support radio groups and dropdown selections where the underlying PDF control supports them
- fail individual unsupported/missing controls safely rather than failing the entire document

Flattened export remains a separate path that writes values at stored coordinates.

Do not mark editable-PDF export release-ready until a complex native form has been exported, reopened in normal PDF software and verified.

### 3. Profile prefill

Keep the useful profile-prefill feature, but constrain it to ordinary reusable profile data:

- display name
- first name
- surname
- email
- phone
- organisation/company
- job title/role
- optional ordinary address data where the user chooses to store it

Profile storage must be scoped to the authenticated user identity so one user does not inherit another user's saved prefill profile in the same browser.

Heuristic matching remains a suggestion/convenience layer. It is not the future canonical BrightOps data-binding layer.

### 4. Signature handling

Do not persist reusable signature images, initials images, signature data URIs or a dedicated reusable signature value in browser `localStorage`.

A typed signature suggestion may use the current authenticated user's display name at runtime, but it must not be represented as a regulated or verified electronic signature.

Phase 1 signing remains lightweight form completion only.

### 5. Authentication boundary

Keep the modular Firebase/Google sign-in implementation.

The current email/domain allow-list is acceptable as an internal prototype UX gate, but client-side checks alone are not a security boundary.

Before shared cloud documents, protected APIs or production personal data are introduced, authorisation must be enforced server-side and/or through Firebase security rules/claims as appropriate.

Do not state that production access control is complete until that enforcement exists and is tested.

### 6. Firebase configuration

Do not commit or adopt an unrelated application Firebase configuration as Form Filler configuration.

Use `VITE_FIREBASE_*` environment values and confirm the approved Firebase project before production or shared-data use.

### 7. Repository alignment

Update the repository to identify:

- BrightOps Form Filler as a BrightOps tool/app, not an engine
- `thebrightergroup/brightops_form_filler` as the implementation repo
- `thebrightergroup/brightops` as parent platform/roadmap context
- Build Control issues #26 and #27 as governance references
- current Phase 1 limitations

Replace the stock AI Studio README with a product-specific README while retaining useful local-run instructions.

### 8. Build and deployment evidence

A successful AI Studio “build” checkpoint is useful implementation evidence but does not replace repository CI evidence.

At the time of this packet, no GitHub Actions workflow run is associated with the current repository commits.

Google Cloud/Cloud Build logs may be connected separately, but they must not be described as available through this repo until retrieval is actually verified.

Future build sync should capture at minimum:

- source checkpoint/build identifier
- commit SHA
- build result
- deploy result if applicable
- test evidence
- known warnings

## Files intentionally affected

Expected implementation changes include:

- `src/types.ts`
- `src/lib/pdfAnalyzer.ts`
- `src/lib/pdfGenerator.ts`
- `src/auth/*`
- `src/components/Prefill*`
- app/header/inspector/start-screen integration files from the latest checkpoint
- environment configuration examples
- repository README and control documentation

No database migration, production schema migration or shared document-storage migration is authorised by this packet.

## Validation

Before merge:

1. TypeScript/build must pass in an environment with dependencies available.
2. Existing 30-page Services Australia test PDF still imports 30 pages and the expected native field population.
3. Native fields retain exact original PDF names.
4. Editable export writes to original native fields rather than transformed machine names.
5. Flattened export remains functional.
6. Saved prefill profiles are separated by authenticated user identity.
7. Browser profile storage contains no reusable signature image/data URI/dedicated signature value.
8. Unauthorised sign-in is rejected in the UI, while documentation clearly states that production server-side authorisation remains future work.
9. Existing document persistence/reopen behaviour remains intact.
10. No secret API keys or credentials are committed.

## Known validation limitation for this correction

Dependency installation/build validation could not be completed in the current inspection runtime because package installation exceeded the available execution window. This is an evidence gap, not a pass. The PR must remain unmerged until CI/local build evidence is supplied.

## Rollback

Close the correction PR without merge, or revert the correction commits if later merged. No production data migration is part of this packet.

## Status

**Prepared for controlled branch/PR review. Not release-ready until build and export validation complete.**
