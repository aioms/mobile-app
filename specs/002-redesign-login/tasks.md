# Tasks: Redesign Login Page

**Input**: Design documents from `/specs/002-redesign-login/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/auth.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify all required Konsta UI design system components (`AppTextField`, `AppButton`, `AppText`) are available in `src/design-system/components` and `src/design-system/primitives`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Back up or prepare the existing `src/pages/Auth/Login/Login.tsx` state before refactoring.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Core Login Flow (Priority: P1) 🎯 MVP

**Goal**: Users need to be able to log in using their credentials via a modern, clean interface built upon the new standardized design system.

**Independent Test**: Can be fully tested by entering valid/invalid credentials on the login screen and verifying the success/failure states and visual feedback.

### Implementation for User Story 1

- [x] T003 [US1] Remove legacy Ionic components (IonPage, IonContent, IonHeader, IonInput, IonButton, etc.) from `src/pages/Auth/Login/Login.tsx`
- [x] T004 [US1] Implement new page layout (using standard React/Tailwind or Konsta UI `Page`) in `src/pages/Auth/Login/Login.tsx`
- [x] T005 [US1] Replace legacy username and password inputs with `AppTextField` components in `src/pages/Auth/Login/Login.tsx`
- [x] T006 [US1] Replace the submit button with `AppButton` and handle loading states in `src/pages/Auth/Login/Login.tsx`
- [x] T007 [US1] Refactor typography to use `AppText` for headers and error messages in `src/pages/Auth/Login/Login.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Password Visibility Toggle (Priority: P2)

**Goal**: Users should be able to toggle the visibility of their password.

**Independent Test**: Can be fully tested by tapping the eye icon in the password field and verifying the text switches between masked dots and plain text.

### Implementation for User Story 2

- [x] T008 [US2] Implement state management for password visibility toggle in `src/pages/Auth/Login/Login.tsx`
- [x] T009 [US2] Integrate the visibility toggle icon into the password `AppTextField` (e.g. using `trailingAction`) in `src/pages/Auth/Login/Login.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Remember Me Functionality (Priority: P2)

**Goal**: Users should be able to opt-in to remain logged in via a "Ghi nhớ đăng nhập" checkbox.

**Independent Test**: Can be fully tested by checking the box, logging in, and verifying the session persists across app restarts.

### Implementation for User Story 3

- [x] T010 [US3] Implement a checkbox UI component aligned with the design system for "Ghi nhớ đăng nhập" in `src/pages/Auth/Login/Login.tsx`
- [x] T011 [US3] Bind the checkbox state to the existing login flow payload in `src/pages/Auth/Login/Login.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Clean up unused styles in `src/pages/Auth/Login/Login.css`
- [x] T013 Verify smooth UI performance (60 fps) and zero layout shifts as per SC-002 and SC-003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Integrates with US1's password field. Should be done after US1 layout is somewhat stable.
- **User Story 3 (P3)**: Integrates with US1's form. Should be done after US1 layout is somewhat stable.

### Implementation Strategy

#### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2: Setup & Foundational
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test Core Login independently
4. Demo if ready

#### Incremental Delivery

1. Add User Story 2 → Test independently → Demo
2. Add User Story 3 → Test independently → Demo
3. Each story adds value without breaking previous stories
