# Project Context

## Purpose

This project is being organized early to avoid uncontrolled growth, inconsistent patterns and duplicated logic.

The goal is to create a clear architectural baseline that can guide developers and AI agents during implementation, review and refactoring.

## Current Stack

- Next.js 16
- App Router
- TypeScript
- Tailwind CSS 4
- Vercel

## Current Situation

The frontend already has working features, but some parts evolved without consistent structure.

The main problems to avoid are:

- duplicated components
- inconsistent UI patterns
- components that work only in one screen
- API calls scattered across pages and components
- large page files with too much responsibility
- unclear separation between route, feature and shared UI
- unsafe broad refactors
- architecture decisions without documentation

## Working Strategy

The project must evolve incrementally.

Before changing production code:

1. understand the current structure;
2. identify existing patterns;
3. compare them with the documented architecture principles;
4. propose a small and safe change;
5. apply the change only after the scope is clear;
6. validate behavior when relevant;
7. update documentation only when a real architectural decision changes.

Do not rewrite the whole frontend at once.

Do not introduce new patterns silently.