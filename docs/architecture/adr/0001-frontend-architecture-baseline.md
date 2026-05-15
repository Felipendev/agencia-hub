# ADR 0001 - Frontend Architecture Baseline

## Status

Accepted

## Context

The frontend needs clearer organization to avoid duplicated components, inconsistent screens and logic tied to specific pages.

Without a documented baseline, components may work in one screen and fail in another because responsibilities are not clear.

## Decision

The frontend will follow a feature-oriented architecture with shared UI components.

The main areas are:

- app
- features
- components
- lib
- styles

The `app/` folder is responsible for routing and composition.

The `features/` folder owns feature-specific logic.

The `components/` folder owns reusable UI, layout and feedback components.

The `lib/` folder owns shared utilities and API infrastructure.

## Consequences

### Positive

- More consistent screens.
- Reusable UI components.
- Less duplicated API logic.
- Easier incremental refactoring.
- Better guidance for AI agents.

### Negative

- Some components will need gradual migration.
- Some duplicated UI must be consolidated.
- Initial organization takes time.