# BG Repo Template

Standard repository template for Brighter Group and BrightOps projects, including governance, documentation, issue, PR and release controls.

This repository is intended to be used as a GitHub template for new Brighter Group and BrightOps repositories.

## Template purpose

Use this template for repositories that need a consistent structure for:

- repo identity and ownership
- decision logging
- build governance
- CAB and approval records
- risk tracking
- release readiness
- issue and PR discipline
- future inclusion in GitHub Control Index

## README setup rule for new repos

When a new repo is created from this template, replace the generic title and purpose at the top of the README with the repo-specific name, purpose and boundary rules.

Keep the standard control sections underneath unless there is a clear reason to remove or alter them.

The usual README pattern is:

```text
# [Repo Name]

## Repo purpose
[Repo-specific purpose]

## Repo boundary rules
[Repo-specific ownership and scope rules]

---

## Standard repo controls
[Keep/adapt from template]

## Standard folders
[Keep/adapt from template]

## First setup steps
[Keep/adapt from template]

## Important rules
[Keep/adapt from template]

## Related control repos
[Keep/adapt from template]
```

## Standard repo controls

New repos created from this template should usually keep these standard control sections:

- repo identity and ownership
- decision logging
- build governance
- CAB and approval records
- risk tracking
- release readiness
- issue and PR discipline
- future inclusion in GitHub Control Index

## Standard folders

```text
.github/
  ISSUE_TEMPLATE/
docs/
  00-control/
  01-discovery/
  02-build/
  03-governance/
  04-release/
  05-archive/
index/
```

## First setup steps after creating a repo from this template

1. Replace the README title and purpose with the repo-specific framing.
2. Keep the standard control sections underneath the repo-specific framing.
3. Complete `docs/00-control/repo-profile.md`.
4. Confirm ownership, status and product boundary.
5. Set the governance mode in `docs/03-governance/governance-status.md`.
6. Add initial decisions to `docs/00-control/decision-log.md`.
7. Confirm whether CAB review is required.
8. Update `thebrightergroup/github-control-index`.

## Important rules

- Do not use this template to mix personal and Brighter Group work.
- Do not classify tools as engines unless approved in the product map.
- Do not treat draft documents as approved company knowledge.
- Keep repo-specific implementation work in the repo that owns that product, tool or service.
- Do not commit secrets, API keys, tokens, passwords or private environment files.
- Use `.env.example` for required environment variable names only.

## Related control repos

Cross-project standards and decisions are held in:

```text
thebrightergroup/brighter-group-control
```

Repository visibility and governance indexing is held in:

```text
thebrightergroup/github-control-index
```
