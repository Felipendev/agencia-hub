# Frontend Architecture

## Goal

The frontend architecture must separate routing, page composition, feature logic, reusable UI, API access and shared utilities.

The goal is to avoid duplicated components, inconsistent screens and logic that works only in one page context.

## Recommended Areas

The recommended frontend areas are:

- app
- features
- components
- lib
- styles

## App Layer

The `app/` folder is responsible for routing, layouts and page composition.

Allowed responsibilities:

- route definition
- layouts
- loading boundaries
- error boundaries
- composing feature components
- basic page-level metadata

Avoid:

- complex business logic
- scattered direct API calls
- large JSX blocks
- duplicated UI patterns
- form logic directly inside pages

## Features Layer

The `features/` folder contains feature-specific logic.

A feature may contain:

- components
- hooks
- services
- schemas
- types
- mappers when needed

Suggested structure:

- `features/<feature>/components`
- `features/<feature>/hooks`
- `features/<feature>/services`
- `features/<feature>/schemas`
- `features/<feature>/types.ts`
- `features/<feature>/index.ts`

Feature components may use shared UI components.

A feature should avoid importing internal files from another feature unless there is a clear shared abstraction.

## Components Layer

The `components/` folder contains reusable components.

Recommended groups:

- `components/ui`
- `components/layout`
- `components/feedback`
- `components/forms`

## UI Components

Components inside `components/ui` must be generic, reusable and visual.

They must not:

- call APIs
- know business rules
- depend on a specific page
- contain feature-specific text or behavior

Examples:

- Button
- Input
- Select
- Card
- Modal
- Table
- Badge
- Loading
- EmptyState

## Lib Layer

The `lib/` folder contains shared utilities and infrastructure code.

Examples:

- HTTP client
- shared helpers
- constants
- shared validations
- shared types when truly reused

## API Access

API calls must be centralized.

Prefer:

- `lib/http/api-client.ts`
- `features/<feature>/services`

Avoid direct `fetch` calls scattered across pages and components.

## Validation

Form and input validation should be colocated with the feature.

Recommended:

- `features/<feature>/schemas`

Shared validation utilities may live in:

- `lib/validations`

## Styling

Use Tailwind consistently.

Avoid repeating long `className` blocks across multiple places.

If a visual pattern repeats, extract it to a reusable component.

## Refactoring Strategy

Do not rewrite the whole frontend at once.

Use this sequence:

1. document current structure;
2. identify duplicated components;
3. create base UI components only when useful;
4. choose one low-risk page or feature;
5. migrate it to the new structure;
6. validate behavior;
7. repeat by feature.