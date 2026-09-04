@AGENTS.md

## SDD Kit

This project uses **SDD Kit** for spec-driven development.

### Spec Language
All specifications MUST be written in **Portuguese (Português)** (`pt`).
Do not mix languages in specs. Technical terms (API, REST, CRUD) stay in English.

### Quick Reference
- Framework expert: `Skill("sdd-kit-expert")`
- Workflow: `/sdd.start` → `/sdd.spec` → `/sdd.plan` → `/sdd.build` → `/sdd.finish`
- Project conventions: `sdd/PROJECT.md`
- Discovered patterns: `sdd/PATTERNS.md`

### Rules
- Never create files under `sdd/specs/`, `sdd/wip/`, or `sdd/features/` manually
- Always go through the `/sdd.start` workflow
- Respect the phased workflow — don't skip phases
