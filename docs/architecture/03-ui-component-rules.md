# UI Component Rules

## Purpose

UI components must make the interface consistent, reusable and predictable.

A component should not work only in one specific screen unless it lives inside that feature.

## Component Types

### Shared UI Components

Shared UI components live in:

- `src/components/ui`

Shared UI components are generic and reusable.

They should receive data and callbacks through props.

They must not call APIs.

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

### Layout Components

Layout components live in:

- `src/components/layout`

Examples:

- Header
- Sidebar
- PageContainer
- Navbar
- Footer

### Feedback Components

Feedback components live in:

- `src/components/feedback`

Examples:

- ErrorMessage
- EmptyState
- LoadingState
- Toast
- Alert

### Feature Components

Feature components live in:

- `src/features/<feature>/components`

Feature components may contain feature-specific behavior, text and composition.

They may use:

- shared UI components
- feature hooks
- feature services
- feature schemas
- feature types

## Extraction Rule

Create a shared component when:

- the same visual pattern appears in more than one feature;
- the component does not depend on business-specific logic;
- the behavior can be controlled through props;
- the component improves consistency.

Keep a component inside a feature when:

- it only makes sense for that feature;
- it contains business-specific text;
- it depends on feature-specific data;
- extracting it would make the API too complex.

## Props

Props must be explicit and typed.

Avoid vague prop names such as:

- data
- config
- item
- object
- value when the meaning is unclear

Prefer names that explain intent.

Examples:

- customer
- isLoading
- onSubmit
- onCancel
- selectedItems
- errorMessage

## Styling

Avoid duplicating long Tailwind `className` strings.

If the same styling appears repeatedly, extract a component or a utility.

Avoid inline styles unless there is a strong reason.

Keep visual variants controlled through props when useful.

Examples:

- variant
- size
- isLoading
- disabled

## Behavior

Shared UI components must be predictable.

Avoid hidden side effects.

Avoid API calls inside shared components.

Avoid business decisions inside shared components.

## Naming

Use clear names.

Prefer:

- CustomerForm
- CustomerTable
- CreateCustomerDialog
- EmptyState
- ErrorMessage

Avoid vague names:

- Box
- Wrapper
- Thing
- Component
- DataView