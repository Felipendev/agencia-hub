# State and Data Fetching

## Goal

Data access must be predictable, centralized and easy to test.

Avoid scattered API calls across pages and components.

## API Client

Use a central HTTP client for shared configuration.

Recommended location:

- `src/lib/http/api-client.ts`

Responsibilities:

- base URL
- headers
- auth token handling when needed
- response parsing
- error normalization

## Feature Services

Feature-specific API calls must live inside the feature.

Recommended location:

- `src/features/<feature>/services`

Service functions should have clear names.

Examples:

- createCustomer
- getCustomerById
- listCustomers
- updateCustomer
- deleteCustomer

Use project-specific names according to the real domain.

Do not copy names from examples blindly.

## Pages

Pages should compose the screen.

Pages should avoid:

- direct API details
- large form logic
- duplicated state management
- complex transformation logic
- large conditional rendering blocks

## Hooks

Use hooks when a component has reusable stateful behavior.

Good candidates:

- form behavior
- modal state
- pagination
- filters
- table state
- feature-specific data loading

Avoid creating hooks for logic that is only one line and not reused.

## Types

Feature-specific types should live inside the feature.

Recommended location:

- `src/features/<feature>/types.ts`

Shared types may live in:

- `src/lib/types`

Only create shared types when they are truly reused.

## Error Handling

Normalize API errors before showing them in UI.

Avoid exposing raw backend errors directly to users unless the message is safe and intentional.

Use consistent error presentation across screens.

## Loading and Empty States

Loading and empty states should be consistent.

Prefer reusable feedback components when the pattern repeats.

Examples:

- LoadingState
- EmptyState
- ErrorMessage

## Refactoring Rule

Do not move all API calls at once.

Start with one low-risk page or feature.

After the pattern works, repeat gradually.