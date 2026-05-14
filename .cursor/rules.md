---
alwaysApply: true
---

# Cursor Rules

## General

- Always read /docs/architecture before changing code.
- Follow the documented frontend architecture.
- Do not refactor the whole project unless explicitly requested.
- Prefer small, safe and incremental changes.
- If the task is analysis-only, do not modify files.
- If the task asks for one feature, do not refactor unrelated features.
- Keep naming descriptive.
- Avoid unclear abbreviations.
- Avoid duplicated logic.
- Do not introduce new patterns without updating architecture documentation when relevant.

## Frontend Architecture

- Use `app/` for routing, layouts and page composition.
- Use `features/` for feature-specific logic.
- Use `components/ui/` for generic reusable UI components.
- Use `components/layout/` for layout components.
- Use `components/feedback/` for loading, error and empty states.
- Use `lib/` for shared utilities, HTTP client and generic helpers.
- Avoid direct API calls scattered across pages and components.
- Prefer feature services for feature-specific API calls.

## Components

- Shared UI components must not call APIs.
- Shared UI components must not contain business rules.
- Shared UI components must be controlled through typed props.
- Feature-specific components must stay inside their feature.
- Extract a component only when it is reusable and not tied to one business context.
- Do not create generic components that are harder to use than duplicated JSX.
- Avoid large JSX blocks inside pages.
- Avoid repeating long Tailwind className strings.

## TypeScript

- Avoid `any`.
- Type component props explicitly.
- Type API requests and responses.
- Keep feature-specific types inside the feature.
- Keep shared types only when they are truly reused.

## Styling

- Use Tailwind consistently.
- Prefer reusable components for repeated visual patterns.
- Avoid inline styles unless there is a strong reason.
- Keep className readable.
- Extract repeated variants into component props when useful.

## State and Data

- Keep API access centralized.
- Use a shared HTTP client when possible.
- Use feature services for feature API calls.
- Use hooks for reusable stateful behavior.
- Do not create hooks for trivial one-line logic.
- Normalize API errors before displaying them.

## Clean Code

- Avoid deeply nested conditions.
- Prefer guard clauses.
- Extract complex rendering conditions to named variables or small components.
- Keep components cohesive.
- Keep files reasonably small.
- Do not add comments unless they explain non-obvious business context or external constraints.
- Do not add TODO comments unless explicitly requested.

## Tests

- Prefer testing behavior over implementation details.
- Add tests when refactoring important logic.
- Do not change behavior unless explicitly requested.