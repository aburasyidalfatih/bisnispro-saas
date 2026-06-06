# Shadcn UI Migration Tasks (Dashboard Scope)

- [x] **Phase 1: Refactor native `<button>` to Shadcn `<Button>`**
  - [x] Write a codemod script for `<button>` replacement.
  - [x] Apply codemod to `src/app/(dashboard)`
  - [x] Apply codemod to `src/app/(super-admin)`
  - [x] Apply codemod to `src/app/(affiliate)`
  - [x] Apply codemod to `src/components/shared`
- [x] **Phase 2: Refactor native `<input>` to Shadcn `<Input>`**
  - [x] Write a codemod script for `<input>` replacement.
  - [x] Apply codemod to the targeted dashboard scopes.
- [x] **Phase 3: Refactor native `<textarea>` to Shadcn `<Textarea>`**
  - [x] Write a codemod script for `<textarea>` replacement.
  - [x] Apply codemod to the targeted dashboard scopes.
- [x] **Phase 4: Linting & Build Verification**
  - [x] Run `npx next build` locally.
  - [x] Fix any `"use client"` or import errors caused by the codemod.
  - [x] Ensure the application builds successfully.
