# Architecture Principles

## Main Principle

Architecture exists to make the system easier to understand, change, test and evolve.

The project must prefer clear boundaries, explicit responsibilities and incremental evolution.

## Incremental Evolution

Prefer small and safe changes.

Avoid broad rewrites unless explicitly approved.

When refactoring, migrate one page, feature or flow at a time.

A migrated feature can become the internal reference for the next migrations.

## Responsibility Boundaries

Each part of the frontend must have a clear responsibility.

Avoid mixing:

- routing with business logic
- reusable UI with feature-specific rules
- API details with visual components
- form logic directly inside large page files
- repeated Tailwind blocks across multiple screens
- feature-specific behavior inside shared components

## Pattern Introduction

Do not introduce a new pattern just because it is generally considered good.

Introduce a pattern only when it solves a real problem in this project.

When a new architectural pattern is introduced, document why it exists and where it should be used.

## Naming

Names must describe intent clearly.

Avoid redundant names when the surrounding context already explains the subject.

Avoid abbreviations that reduce readability.

Prefer consistency over personal preference.

## Documentation

Documentation must be practical.

Avoid documenting generic theory.

Document:

- decisions
- project-specific conventions
- recurring patterns
- architecture boundaries
- examples that help future changes

Avoid excessive repetition between documents.