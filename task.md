# Shadcn UI Migration Tasks (Dashboard Scope)

- [ ] **Phase 1: Refactor native `<button>` to Shadcn `<Button>`**
  - [ ] Write a codemod script for `<button>` replacement.
  - [ ] Apply codemod to `src/app/(dashboard)`
  - [ ] Apply codemod to `src/app/(super-admin)`
  - [ ] Apply codemod to `src/app/(affiliate)`
  - [ ] Apply codemod to `src/components/shared`
- [ ] **Phase 2: Refactor native `<input>` to Shadcn `<Input>`**
  - [ ] Write a codemod script for `<input>` replacement.
  - [ ] Apply codemod to the targeted dashboard scopes.
- [ ] **Phase 3: Refactor native `<textarea>` to Shadcn `<Textarea>`**
  - [ ] Write a codemod script for `<textarea>` replacement.
  - [ ] Apply codemod to the targeted dashboard scopes.
- [ ] **Phase 4: Linting & Build Verification**
  - [ ] Run `npx next build` locally.
  - [ ] Fix any `"use client"` or import errors caused by the codemod.
  - [ ] Ensure the application builds successfully.
