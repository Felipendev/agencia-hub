# Implementation Plan: Agency Onboarding, Multi-Tenancy & Authentication

## Overview

This plan implements the transformation of AgenciaHub from single-tenant to multi-tenant architecture. Implementation follows a bottom-up approach: database migration first, then backend entities, security layer, services, controllers, and finally frontend pages and components. The backend uses Java (Spring Boot) and the frontend uses TypeScript (Next.js).

## Tasks

- [x] 1. Database Migration V9 — Multi-Tenancy Schema
  - [x] 1.1 Create Flyway migration V9__multi_tenancy_agencies.sql
    - Create `agencies` table with all columns (id, name, phone, logo_url, cnpj, address, commercial_email, status, subscription_status, trial_ends_at, created_at, updated_at)
    - Add `agency_id` column to `users`, `customers`, `opportunities`, `quotations`, `financial_entries` tables
    - Add `phone`, `email_verified`, `password_changed_at` columns to `users` table
    - Create default agency and link all existing data to it
    - Set `agency_id` as NOT NULL after data migration
    - Create indexes for multi-tenancy filtering
    - Create `invitations` table with token, status, expiration
    - Create `verification_codes` table with hash, type, attempts
    - Create `terms_acceptances` table
    - Create `agency_audit_log` table
    - _Requirements: 2.1, 10.1, 10.2, 10.3, 10.4_

- [x] 2. Backend Domain Enums and Value Objects
  - [x] 2.1 Create domain enums
    - Create `AgencyStatus` enum (PENDING_VERIFICATION, TRIAL, ACTIVE, SUSPENDED, CANCELED)
    - Create `SubscriptionStatus` enum (TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELED)
    - Create `InvitationStatus` enum (PENDING, ACCEPTED, EXPIRED, REVOKED)
    - Create `VerificationCodeType` enum (EMAIL_VERIFICATION, PASSWORD_RESET)
    - _Requirements: 14.1, 16.1, 3.9_

- [x] 3. Backend Entities (JPA)
  - [x] 3.1 Create Agency entity
    - Define `Agency.java` with all fields mapped to `agencies` table
    - Include JPA annotations, lifecycle callbacks for `createdAt`/`updatedAt`
    - _Requirements: 2.1, 16.1, 17.1_

  - [x] 3.2 Modify User entity for multi-tenancy
    - Add `agencyId` (UUID, FK to agencies), `phone`, `emailVerified`, `passwordChangedAt` fields
    - Add `@ManyToOne` relationship to Agency
    - _Requirements: 2.1, 5.1, 13.5_

  - [x] 3.3 Create Invitation entity
    - Define `Invitation.java` with agency_id, invited_by, email, token, status, expires_at, accepted_at
    - _Requirements: 3.1, 3.7, 3.8, 3.9_

  - [x] 3.4 Create VerificationCode entity
    - Define `VerificationCode.java` with user_id, email, code_hash, type, attempts, used, expires_at
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 3.5 Create TermsAcceptance entity
    - Define `TermsAcceptance.java` with user_id, terms_version, ip_address, accepted_at
    - _Requirements: 11.3, 11.4_

- [x] 4. Backend Repositories
  - [x] 4.1 Create AgencyRepository
    - Add `findBySubscriptionStatusAndTrialEndsAtBefore` for trial scheduler
    - _Requirements: 14.3, 16.4_

  - [x] 4.2 Create InvitationRepository
    - Add `findByToken`, `findByAgencyIdAndStatus`, `findByEmailAndStatus`
    - _Requirements: 3.1, 3.9, 3.10_

  - [x] 4.3 Create VerificationCodeRepository
    - Add `findByEmailAndTypeAndUsedFalse`, `countByEmailAndCreatedAtAfter`
    - _Requirements: 8.4, 8.5, 1.8_

  - [x] 4.4 Create TermsAcceptanceRepository
    - Add `findByUserIdOrderByAcceptedAtDesc`
    - _Requirements: 11.4_

  - [x] 4.5 Modify existing repositories to add agency_id filtering
    - Update `CustomerRepository` queries to include `agency_id` parameter
    - Update `OpportunityRepository` queries to include `agency_id` parameter
    - Update `QuotationRepository` queries to include `agency_id` parameter
    - Update `FinancialEntryRepository` queries to include `agency_id` parameter
    - _Requirements: 2.2, 2.3_

- [x] 5. Security Layer — TenantContext and JWT Modifications
  - [x] 5.1 Create TenantContext (ThreadLocal)
    - Implement `TenantContext.java` with static `set`, `get`, `clear` methods using ThreadLocal<UUID>
    - _Requirements: 2.2, 2.3_

  - [x] 5.2 Create TenantInterceptor
    - Implement `TenantInterceptor.java` that extracts `agency_id` from SecurityContext and sets TenantContext
    - Clear TenantContext in `afterCompletion`
    - _Requirements: 2.2, 2.3_

  - [x] 5.3 Register TenantInterceptor in WebMvcConfigurer
    - Create `TenantInterceptorConfig.java` to register the interceptor for authenticated routes
    - Exclude public routes from interception
    - _Requirements: 2.2_

  - [x] 5.4 Modify JWT token generation to include agency_id and password_changed_at claims
    - Update `JwtService` (or equivalent) to add `agency_id` and `password_changed_at` to token payload
    - _Requirements: 5.1, 5.5_

  - [x] 5.5 Modify JwtAuthFilter to extract agency_id and validate password_changed_at
    - Extract `agency_id` from token and populate TenantContext
    - Compare `password_changed_at` claim with user's current value; reject if token is stale
    - _Requirements: 5.1, 7.4_

  - [x] 5.6 Update SecurityConfig with new public routes
    - Add `/auth/register`, `/auth/verify-email`, `/auth/resend-code`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/invite/**`, `/auth/register-invite`, `/public/terms/**` as permitted
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.7 Write property tests for JWT claims and tenant isolation
    - **Property 8: JWT contains valid agency_id**
    - **Property 6: Data isolation by tenant**
    - **Property 7: Cross-tenant access returns 403**
    - **Validates: Requirements 5.1, 5.5, 2.2, 2.3, 2.4**

- [x] 6. Checkpoint — Database and Security Layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Validation Layer
  - [x] 7.1 Create PhoneValidator
    - Validate Brazilian phone numbers: 10 digits (landline) or 11 digits (mobile) with DDD
    - Strip non-digit characters, validate length
    - _Requirements: 13.3, 13.4_

  - [ ]* 7.2 Write property test for phone validation
    - **Property 14: Brazilian phone format validation**
    - **Validates: Requirements 13.3, 13.4**

  - [ ]* 7.3 Write property test for password minimum length
    - **Property 4: Password minimum length validation**
    - **Validates: Requirements 1.6, 6.6, 7.3**

- [x] 8. Email Service
  - [x] 8.1 Create EmailService interface
    - Define methods: `sendVerificationCode`, `sendInvitation`, `sendPasswordResetCode`
    - _Requirements: 1.2, 3.2, 6.1_

  - [x] 8.2 Implement transactional email (Resend/SMTP/logging via `MailDispatchConfiguration`)
    - Implement `EmailService` using Spring Boot Starter Mail
    - Configure retry with exponential backoff (3 attempts)
    - Add email templates for verification, invitation, and password reset
    - Add configuration properties in `application.yml`
    - _Requirements: 1.2, 3.2, 6.1_

- [x] 9. Verification Code Service
  - [x] 9.1 Implement VerificationCodeService
    - Generate random 6-digit codes
    - Store codes as BCrypt hash
    - Validate codes against hash with expiration check (15 min)
    - Invalidate previous codes when new one is generated for same email
    - Track attempts (max 5 per code)
    - Rate limit resends (5 per hour per email)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 1.7, 1.8_

  - [ ]* 9.2 Write property tests for verification code service
    - **Property 1: Round-trip of verification code (generate hash, verify original succeeds, verify different fails)**
    - **Property 3: Invalid or expired code rejection**
    - **Property 5: New code invalidates previous ones**
    - **Validates: Requirements 1.3, 1.5, 1.7, 3.6, 6.2, 6.4, 8.1, 8.2, 8.3, 8.4**

- [x] 10. Agency Service
  - [x] 10.1 Implement AgencyService
    - Create agency (with PENDING_VERIFICATION status)
    - Update agency data (name, phone, cnpj, address, commercial_email)
    - Upload logo (validate format PNG/JPG/SVG, max 2MB)
    - Get agency by ID
    - Validate CNPJ format and check digits
    - Record audit log entries for all changes
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.7_

  - [ ]* 10.2 Write property test for subscription status state machine
    - **Property 15: Subscription status state machine (valid transitions only)**
    - **Validates: Requirements 14.1, 14.3, 14.5, 14.6, 14.7, 14.8, 16.1-16.5**

- [x] 11. Auth Service — Registration Flow
  - [x] 11.1 Implement agency registration (POST /auth/register)
    - Create Agency + Owner User in single transaction
    - Validate email uniqueness (case-insensitive, trimmed)
    - Validate password length >= 8
    - Validate password confirmation match
    - Validate phone format
    - Validate terms acceptance
    - Generate and send verification code
    - Record terms acceptance with IP and version
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 11.2, 11.3, 12.6, 13.4_

  - [x] 11.2 Implement email verification (POST /auth/verify-email)
    - Validate code against hash
    - Activate user (email_verified = true)
    - Transition agency status to TRIAL
    - Set trial_ends_at = now + 10 days
    - Return JWT token on success
    - _Requirements: 1.3, 1.5, 14.1, 16.2_

  - [x] 11.3 Implement resend code (POST /auth/resend-code)
    - Generate new code, invalidate previous
    - Enforce rate limit (5/hour)
    - _Requirements: 1.7, 1.8_

  - [ ]* 11.4 Write property tests for registration
    - **Property 2: Email uniqueness (case-insensitive)**
    - **Property 13: Registration rejected without terms acceptance**
    - **Property 17: Password confirmation must match**
    - **Validates: Requirements 1.4, 4.3, 11.2, 12.2, 12.4, 12.5, 12.6**

- [x] 12. Auth Service — Login Modifications
  - [x] 12.1 Modify login to include agency_id in JWT and response
    - Add agency_id, agencyName, agencyStatus, trialEndsAt to login response
    - Reject login if email_verified = false
    - Reject login if user.active = false
    - Reject login if agency status is PENDING_VERIFICATION or CANCELED
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 16.6, 16.7_

  - [ ]* 12.2 Write property tests for login
    - **Property 9: Unverified or inactive account prevents login**
    - **Validates: Requirements 5.3, 5.4**

- [x] 13. Auth Service — Password Recovery and Change
  - [x] 13.1 Implement forgot password (POST /auth/forgot-password)
    - Always return 200 OK regardless of email existence (prevent enumeration)
    - Generate and send verification code if email exists
    - Rate limit: 5 requests/hour/email
    - _Requirements: 6.1, 6.3, 6.5_

  - [x] 13.2 Implement reset password (POST /auth/reset-password)
    - Validate code, update password, set password_changed_at to invalidate old tokens
    - Validate new password length >= 8
    - _Requirements: 6.2, 6.4, 6.6_

  - [x] 13.3 Implement change password (POST /auth/change-password) — authenticated
    - Validate current password
    - Validate new password length >= 8
    - Update password_changed_at to invalidate all previous tokens
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 13.4 Write property tests for password flows
    - **Property 12: Password change invalidates previous tokens**
    - **Property 18: Non-disclosure in password recovery (identical response for existing/non-existing emails)**
    - **Validates: Requirements 7.4, 6.3**

- [x] 14. Checkpoint — Core Auth Flows
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Invitation Service
  - [x] 15.1 Implement InvitationService
    - Create invitation: generate UUID token, set expiration (72h), send email
    - Validate invite token: check existence, expiration, status
    - List invitations by agency
    - Revoke invitation (set status REVOKED)
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.9, 3.10_

  - [x] 15.2 Implement register via invite (POST /auth/register-invite)
    - Validate token (not expired, not used, not revoked)
    - Create seller user linked to invitation's agency
    - Send verification code
    - Mark invitation as ACCEPTED after verification
    - _Requirements: 3.4, 3.5, 3.6_

  - [x] 15.3 Implement invite validation endpoint (GET /auth/invite/{token})
    - Return invitation details (email, agency name) if valid
    - Return appropriate error if expired/used/revoked
    - _Requirements: 3.4, 3.7, 3.8_

  - [ ]* 15.4 Write property tests for invitations
    - **Property 10: Expired or used token is rejected**
    - **Property 11: Invitation creates seller in correct agency**
    - **Validates: Requirements 3.5, 3.7, 3.8, 3.10**

- [x] 16. Trial Scheduler Service
  - [x] 16.1 Implement TrialSchedulerService
    - Create `@Scheduled` method running daily at 2:00 AM
    - Query agencies with TRIAL status and trial_ends_at < now
    - Transition matching agencies to SUSPENDED status
    - _Requirements: 14.3, 16.4_

- [x] 17. Permission Enforcement (Backend)
  - [x] 17.1 Add @PreAuthorize annotations for OWNER-only endpoints
    - Agency endpoints (GET/PATCH /agency, POST /agency/logo): OWNER only
    - Invitation endpoints (POST/GET/DELETE /invitations): OWNER only
    - Financial endpoints: OWNER only
    - Seller management endpoints: OWNER only
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 17.5, 17.6_

  - [ ]* 17.2 Write property tests for permission enforcement
    - **Property 16: OWNER/SELLER permission enforcement**
    - **Validates: Requirements 15.2, 15.3, 15.4, 15.9**

- [x] 18. Backend Controllers
  - [x] 18.1 Create AgencyController
    - GET /agency — return current user's agency data
    - PATCH /agency — update agency fields (validate CNPJ, phone format)
    - POST /agency/logo — handle multipart upload (validate format, size)
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 18.2 Create InvitationController
    - POST /invitations — create invitation (OWNER only)
    - GET /invitations — list agency invitations (OWNER only)
    - DELETE /invitations/{id} — revoke pending invitation (OWNER only)
    - _Requirements: 3.1, 3.9, 3.10_

  - [x] 18.3 Update AuthController with new endpoints
    - POST /auth/register — agency registration
    - POST /auth/verify-email — email verification
    - POST /auth/resend-code — resend verification code
    - POST /auth/forgot-password — request password reset
    - POST /auth/reset-password — reset password with code
    - POST /auth/change-password — change password (authenticated)
    - GET /auth/invite/{token} — validate invite token
    - POST /auth/register-invite — register via invitation
    - _Requirements: 1.1, 1.3, 1.7, 6.1, 6.2, 7.1, 3.4, 3.5_

  - [x] 18.4 Create TermsController
    - GET /public/terms/latest — return current terms version (public)
    - POST /terms/accept — record terms acceptance (authenticated)
    - _Requirements: 11.5, 11.7_

- [x] 19. Backend DTOs
  - [x] 19.1 Create request/response DTOs
    - `RegisterAgencyRequest` (agencyName, ownerName, email, password, passwordConfirmation, ownerPhone, agencyPhone, termsAccepted, termsVersion)
    - `VerifyEmailRequest` (email, code)
    - `ResendCodeRequest` (email)
    - `ForgotPasswordRequest` (email)
    - `ResetPasswordRequest` (email, code, newPassword, newPasswordConfirmation)
    - `ChangePasswordRequest` (currentPassword, newPassword, newPasswordConfirmation)
    - `RegisterViaInviteRequest` (token, name, password, passwordConfirmation, phone)
    - `CreateInvitationRequest` (email)
    - `UpdateAgencyRequest` (name, phone, cnpj, address, commercialEmail)
    - `AgencyResponse`, `InvitationResponse`, `LoginResponse` (updated)
    - Add Jakarta Bean Validation annotations on all request DTOs
    - _Requirements: 1.1, 1.6, 3.1, 6.1, 7.1, 12.6, 13.4, 17.1_

- [x] 20. Checkpoint — Full Backend Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Frontend — Public Pages (Registration Flow)
  - [x] 21.1 Create /cadastro (RegisterPage)
    - Form fields: agency name, owner name, email, password, password confirmation, owner phone (required), agency phone (optional)
    - Terms acceptance checkbox with links to /termos and /privacidade
    - Client-side validation: password match, min 8 chars, phone format, terms checked
    - On success: redirect to /cadastro/verificar
    - _Requirements: 1.1, 9.2, 9.6, 11.1, 12.1, 12.2, 12.5, 13.1, 13.2_

  - [x] 21.2 Create /cadastro/verificar (VerifyEmailPage)
    - 6-digit code input with auto-focus between fields
    - Resend code button with cooldown timer
    - On success: store JWT and redirect to dashboard
    - _Requirements: 1.3, 1.5, 1.7_

  - [x] 21.3 Create /convite/[token] (InviteRegisterPage)
    - Validate token on page load (GET /auth/invite/{token})
    - Show error states for expired/used/revoked tokens
    - Form: name, password, password confirmation, phone (optional)
    - Email pre-filled and disabled
    - On success: redirect to verification page
    - _Requirements: 3.4, 3.5, 3.7, 3.8, 9.3, 12.3, 12.4_

  - [x] 21.4 Create /recuperar-senha (ForgotPasswordPage)
    - Email input form
    - On submit: show success message regardless of result
    - Link to go back to login
    - _Requirements: 6.1, 6.3, 9.4_

  - [x] 21.5 Create /recuperar-senha/redefinir (ResetPasswordPage)
    - 6-digit code input + new password + password confirmation
    - Validate password match and min length on client
    - On success: redirect to login with success message
    - _Requirements: 6.2, 6.4, 6.6_

  - [x] 21.6 Create /termos (TermsPage) and /privacidade (PrivacyPage)
    - Public pages displaying terms of use and privacy policy content
    - _Requirements: 11.7_

- [x] 22. Frontend — Shared Components
  - [x] 22.1 Create VerificationCodeInput component
    - 6 individual digit inputs with auto-focus on next field
    - Handle paste of full code
    - Handle backspace navigation
    - _Requirements: 1.3, 8.1_

  - [x] 22.2 Create PhoneInput component
    - Brazilian phone mask: (XX) XXXXX-XXXX (mobile) or (XX) XXXX-XXXX (landline)
    - Strip formatting on submit, store digits only
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 22.3 Create PasswordStrengthIndicator component
    - Visual indicator showing password strength
    - Minimum 8 characters validation feedback
    - _Requirements: 1.6_

  - [x] 22.4 Create TrialBanner component
    - Display remaining trial days when agency status is TRIAL
    - Show warning when trial is about to expire (last 3 days)
    - _Requirements: 14.9_

  - [x] 22.5 Create TermsCheckbox component
    - Checkbox with text "Li e aceito os Termos de Uso e a Politica de Privacidade"
    - Links to /termos and /privacidade opening in new tab
    - _Requirements: 11.1_

- [-] 23. Frontend — Authenticated Pages
  - [x] 23.1 Create /agencia (AgencySettingsPage) — OWNER only
    - Display and edit: agency name, commercial phone, logo, CNPJ, address, commercial email
    - Logo upload with preview (PNG, JPG, SVG, max 2MB)
    - CNPJ validation on client side
    - Save changes via PATCH /agency
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 23.2 Create /vendedores/convidar (InviteSellersPage) — OWNER only
    - Form to invite seller by email
    - List of pending/accepted/expired invitations
    - Copy invite link button
    - Revoke pending invitation button
    - _Requirements: 3.1, 3.3, 3.9, 3.10_

  - [x] 23.3 Add change password section to user settings
    - Form: current password, new password, new password confirmation
    - Client-side validation: min 8 chars, passwords match
    - On success: logout user (token invalidated)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 24. Frontend — Navigation and Auth Context Updates
  - [x] 24.1 Update auth context/store to include agency data
    - Store agency_id, agencyName, agencyStatus, trialEndsAt from login response
    - Add role-based access helpers (isOwner, isSeller)
    - _Requirements: 5.1, 15.10_

  - [x] 24.2 Update navigation/sidebar
    - Add "Agência" menu item (OWNER only)
    - Add "Convidar Vendedores" menu item (OWNER only)
    - Hide financial module for SELLER role
    - Show TrialBanner when status is TRIAL
    - _Requirements: 15.1, 15.2, 15.10, 14.9_

  - [x] 24.3 Update login page with links
    - Add "Criar conta" link to /cadastro
    - Add "Esqueci minha senha" link to /recuperar-senha
    - Redirect authenticated users to dashboard
    - _Requirements: 9.5, 9.7_

  - [x] 24.4 Add route guards for OWNER-only pages
    - Redirect SELLER users attempting to access OWNER-only routes
    - Show 403 message or redirect to dashboard
    - _Requirements: 15.9, 15.10_

- [x] 25. Frontend — Existing Query Modifications
  - [x] 25.1 Verify frontend API calls work with tenant-filtered backend
    - Ensure all existing pages (customers, opportunities, quotations, financial) work correctly with the new backend filtering
    - No frontend query changes needed since filtering happens server-side, but verify no hardcoded IDs or assumptions break
    - _Requirements: 2.2, 2.3_

- [x] 26. Checkpoint — Frontend Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 27. Terms Enforcement Flow
  - [x] 27.1 Implement terms version check on login (backend)
    - After login, check if user has accepted latest terms version
    - If not, include `requiresTermsAcceptance: true` in login response
    - _Requirements: 11.5, 11.6_

  - [x] 27.2 Implement terms acceptance gate (frontend)
    - If login response includes `requiresTermsAcceptance: true`, redirect to terms acceptance page
    - Block access to app until terms are accepted
    - _Requirements: 11.5, 11.6_

- [x] 28. Final Integration and Wiring
  - [x] 28.1 Wire TrialBanner into main layout
    - Show banner on all authenticated pages when agency is in TRIAL
    - _Requirements: 14.9_

  - [x] 28.2 Ensure email verification flow for commercial email change
    - When owner changes agency commercial email, send verification code to new email
    - Only update after code is verified
    - _Requirements: 17.8_

  - [ ]* 28.3 Write integration tests for end-to-end flows
    - Test full registration flow: register → verify → login → create customer
    - Test invitation flow: create invite → register via invite → verify → login
    - Test multi-tenancy: two agencies, verify data isolation
    - Test trial expiration via scheduler
    - _Requirements: 1.1, 1.3, 2.2, 3.1, 3.5, 14.3_

- [x] 29. Final Checkpoint — All Features Integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Migration V9 is the ONLY new migration file — never edit existing V1-V8 migrations
- Backend language: Java (Spring Boot)
- Frontend language: TypeScript (Next.js)
