# Implementation Plan: Soft Delete

## Overview

Implementação da exclusão lógica (soft delete) para as entidades Quotation e Customer no AgenciaHub. A abordagem é incremental: primeiro a camada de banco de dados, depois o backend (entidades → repositories → services → controllers), e por fim o frontend (API modules → componentes → páginas → navegação).

## Tasks

- [x] 0. Fix 403 on listQuotationsRemote — add authentication token
  - [x] 0.1 Update listQuotationsRemote to accept and send auth token
    - Refactor `src/lib/api/list-quotations-remote.ts` to use `apiFetch` or accept a `token` parameter
    - Add `Authorization: Bearer <token>` header to the GET `/quotations` request
    - This fixes the 403 Forbidden error seen in browser network logs when calling the Railway API directly without credentials
  - [x] 0.2 Update syncCotacoesFromApi in data-context to pass the auth token
    - Update `syncCotacoesFromApi` in `src/contexts/data-context.tsx` to retrieve and pass the user's token to `listQuotationsRemote`
    - Ensure all callers of `syncCotacoesFromApi` provide or have access to the token

- [x] 1. Database migration for soft delete columns
  - [x] 1.1 Create Flyway migration V8__soft_delete.sql
    - Create file `src/main/resources/db/migration/V8__soft_delete.sql`
    - Add `deleted_at TIMESTAMP WITH TIME ZONE` column to `quotations` table
    - Add `deleted_at TIMESTAMP WITH TIME ZONE` column to `customers` table
    - Create partial indexes for active records (`WHERE deleted_at IS NULL`)
    - Create partial indexes for deleted records (`WHERE deleted_at IS NOT NULL`)
    - IMPORTANT: Do NOT edit any existing migration files (V1–V7)
    - _Requirements: 1.1_

- [x] 2. Backend entity and DTO changes
  - [x] 2.1 Add deletedAt field to Quotation entity
    - Add `private Instant deletedAt` field with `@Column(name = "deleted_at")` annotation
    - Add getter and setter methods
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Add deletedAt field to Customer entity
    - Add `private Instant deletedAt` field with `@Column(name = "deleted_at")` annotation
    - Add getter and setter methods
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Add deletedAt field to QuotationResponse DTO
    - Add `Instant deletedAt` field to the response DTO
    - Ensure mapping from entity to DTO includes the new field
    - _Requirements: 5.4_

  - [x] 2.4 Add deletedAt field to CustomerResponse DTO
    - Add `Instant deletedAt` field to the response DTO
    - Ensure mapping from entity to DTO includes the new field
    - _Requirements: 5.4_

- [x] 3. Backend repository layer
  - [x] 3.1 Add soft-delete query methods to QuotationRepository
    - Add `findAllActive()` — returns quotations where `deletedAt IS NULL` ordered by `createdAt DESC`
    - Add `findAllDeleted()` — returns quotations where `deletedAt IS NOT NULL` ordered by `deletedAt DESC`
    - Add `findActiveById(UUID id)` — returns Optional for active quotation by ID
    - Add `findDeletedById(UUID id)` — returns Optional for deleted quotation by ID
    - _Requirements: 4.1, 4.4, 5.1_

  - [x] 3.2 Add soft-delete query methods to CustomerRepository
    - Add `findByDeletedAtIsNullOrderByCreatedAtDesc()`
    - Add `findByDeletedAtIsNotNullOrderByDeletedAtDesc()`
    - Add `findByIdAndDeletedAtIsNull(UUID id)`
    - Add `findByIdAndDeletedAtIsNotNull(UUID id)`
    - Add filtered search methods that include `deletedAt IS NULL` condition
    - _Requirements: 4.2, 4.5, 5.2_

- [x] 4. Backend service layer — soft delete and restore logic
  - [x] 4.1 Implement softDelete, restore, and listDeleted in QuotationService
    - Add `softDelete(UUID id)` — finds active quotation, sets `deletedAt = Instant.now()`
    - Add `restore(UUID id)` — finds deleted quotation, sets `deletedAt = null`, returns response
    - Add `listDeleted()` — returns list of deleted quotation responses
    - Throw `ResourceNotFoundException` for invalid IDs or wrong state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.3, 6.5, 6.6_

  - [x] 4.2 Implement softDelete, restore, and listDeleted in CustomerService
    - Add `softDelete(UUID id)` — finds active customer, sets `deletedAt = Instant.now()`
    - Add `restore(UUID id)` — finds deleted customer, sets `deletedAt = null`, returns response
    - Add `listDeleted()` — returns list of deleted customer responses
    - Ensure soft-delete does NOT cascade to associated quotations
    - Throw `ResourceNotFoundException` for invalid IDs or wrong state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.2, 6.4, 6.5, 6.6_

  - [x] 4.3 Update existing listing/search queries to filter out deleted records
    - Update `QuotationService.search()` to add `deletedAt IS NULL` predicate to the Specification
    - Update `CustomerService` search/list methods to use the new filtered repository methods
    - Ensure SellerDashboard metrics exclude deleted records (inherits from QuotationService.search)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 4.4 Write property test: Soft-delete defines timestamp and preserves data
    - **Property 1: Soft-delete define timestamp e preserva dados**
    - Use jqwik to generate arbitrary Quotation/Customer entities
    - Assert that after softDelete, `deletedAt` is non-null and all other fields are unchanged
    - **Validates: Requirements 2.1, 2.5, 3.1, 3.5**

  - [ ]* 4.5 Write property test: Customer deletion does not cascade to quotations
    - **Property 2: Exclusão de cliente não cascateia para cotações**
    - Use jqwik to generate a Customer with associated Quotations
    - Assert that after softDelete of Customer, all associated Quotations retain `deletedAt = null`
    - **Validates: Requirements 3.6**

  - [ ]* 4.6 Write property test: Active listings exclude deleted records
    - **Property 3: Listagens ativas excluem registros deletados**
    - Use jqwik to generate mixed sets of active and deleted records
    - Assert that active listing queries return only records with `deletedAt = null`
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

  - [ ]* 4.7 Write property test: Trash returns only deleted records
    - **Property 4: Lixeira retorna apenas registros deletados**
    - Use jqwik to generate mixed sets of active and deleted records
    - Assert that trash listing returns only records with `deletedAt != null`, ordered by `deletedAt DESC`
    - **Validates: Requirements 5.1, 5.2, 5.6**

  - [ ]* 4.8 Write property test: Round-trip soft-delete/restore preserves data
    - **Property 5: Round-trip soft-delete/restore preserva dados**
    - Use jqwik to generate arbitrary active entities
    - Assert that softDelete followed by restore results in `deletedAt = null` and all other fields identical to original
    - **Validates: Requirements 6.1, 6.2, 6.6**

  - [ ]* 4.9 Write property test: Newly created entities have deletedAt null
    - **Property 6: Entidades criadas possuem deletedAt nulo**
    - Use jqwik to generate arbitrary valid creation payloads
    - Assert that the resulting entity has `deletedAt = null`
    - **Validates: Requirements 1.2**

- [x] 5. Checkpoint — Backend logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend controller layer — REST endpoints
  - [x] 6.1 Add DELETE endpoint to QuotationController
    - Add `@DeleteMapping("/{id}")` method that calls `quotationService.softDelete(id)`
    - Return HTTP 204 No Content on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 6.2 Add DELETE endpoint to CustomerController
    - Add `@DeleteMapping("/{id}")` method that calls `customerService.softDelete(id)`
    - Return HTTP 204 No Content on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Create TrashController with trash and restore endpoints
    - Create new `TrashController` class in the controller package
    - Add `GET /trash/quotations` — lists deleted quotations
    - Add `GET /trash/customers` — lists deleted customers
    - Add `POST /trash/quotations/{id}/restore` — restores a quotation
    - Add `POST /trash/customers/{id}/restore` — restores a customer
    - Add proper `@Tag`, `@Operation` annotations for Swagger documentation
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.4 Write integration tests for soft-delete and restore endpoints
    - Test DELETE `/quotations/{id}` returns 204 and record is no longer in active listing
    - Test DELETE `/customers/{id}` returns 204 and record is no longer in active listing
    - Test GET `/trash/quotations` returns only deleted quotations
    - Test GET `/trash/customers` returns only deleted customers
    - Test POST `/trash/quotations/{id}/restore` returns 200 and record reappears in active listing
    - Test POST `/trash/customers/{id}/restore` returns 200 and record reappears in active listing
    - Test 404 responses for non-existent or wrong-state IDs
    - Test that SellerDashboard does not count deleted records
    - _Requirements: 2.2, 2.3, 2.4, 3.2, 3.3, 3.4, 4.3, 4.8, 6.3, 6.4, 6.5_

- [x] 7. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend API modules for soft delete
  - [x] 8.1 Create soft-delete API module
    - Create `src/lib/api/soft-delete-remote.ts`
    - Implement `softDeleteQuotation(id, token)` — calls `DELETE /quotations/{id}`
    - Implement `softDeleteCustomer(id, token)` — calls `DELETE /customers/{id}`
    - Implement `listDeletedQuotations(token)` — calls `GET /trash/quotations`
    - Implement `listDeletedCustomers(token)` — calls `GET /trash/customers`
    - Implement `restoreQuotation(id, token)` — calls `POST /trash/quotations/{id}/restore`
    - Implement `restoreCustomer(id, token)` — calls `POST /trash/customers/{id}/restore`
    - Follow existing patterns from `list-quotations-remote.ts` and `create-quotation-remote.ts`
    - _Requirements: 7.4, 8.4_

- [x] 9. Frontend confirmation dialog component
  - [x] 9.1 Create reusable ConfirmDialog component
    - Create `src/components/ui/confirm-dialog.tsx`
    - Implement modal with title, message, "Cancelar" and "Confirmar" buttons
    - Support customizable button labels and destructive styling for delete actions
    - Ensure accessibility (focus trap, aria attributes, keyboard navigation)
    - _Requirements: 7.3_

- [x] 10. Frontend — Add delete actions to existing listings
  - [x] 10.1 Add delete button to Cotações listing/Kanban
    - Add a delete icon/button to each quotation card or list item in `/cotacoes`
    - Wire click handler to show ConfirmDialog
    - On confirm, call `softDeleteQuotation` and remove item from UI optimistically
    - Show error toast on failure
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Add delete button to Clientes listing
    - Add a delete icon/button to each customer row in `/clientes`
    - Wire click handler to show ConfirmDialog
    - On confirm, call `softDeleteCustomer` and remove item from UI optimistically
    - Show error toast on failure
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 11. Frontend — Lixeira page
  - [x] 11.1 Create Lixeira page with tabs for Cotações and Clientes
    - Create route at `src/app/(app)/lixeira/page.tsx`
    - Implement tabs to switch between "Cotações" and "Clientes"
    - Fetch deleted items using `listDeletedQuotations` and `listDeletedCustomers`
    - Display main info for each item (title/name, destination, deletion date)
    - Order items by deletion date (most recent first)
    - Add "Restaurar" button for each item
    - On restore, call the appropriate restore API function, remove item from list, show success toast
    - Show error toast on failure
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Frontend — Navigation update
  - [x] 12.1 Add Lixeira link to sidebar navigation
    - Edit `src/components/layout/dashboard-shell.tsx`
    - Add "Lixeira" menu item with trash icon in the "Principal" group
    - Ensure visibility for OWNER and SELLER roles
    - _Requirements: 8.1_

- [x] 13. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- IMPORTANT: Migration V8 is a NEW file — never edit existing migrations (V1–V7)
- The backend uses jqwik for property-based testing
- Frontend follows existing patterns in `src/lib/api/` for API modules
