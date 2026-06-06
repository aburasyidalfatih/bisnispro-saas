# Task List: Deep UI Button Fixes

- [x] **Create Codemod Script**
  - [x] Write logic to parse and revert structural `<Button>` to `<button>` (when containing `div`, `p`, or `flex` spans).
  - [x] Write logic to inject `variant="ghost" size="icon"` to icon-only buttons.
  - [x] Write logic to inject `variant="link" className="p-0 h-auto"` to text link buttons (`hover:underline`).
- [x] **Execute Codemod**
  - [x] Run the script on `src/app/(dashboard)`, `src/app/(super-admin)`, `src/app/(affiliate)`, and `src/components/shared`.
- [x] **Verification**
  - [/] Run `npx next build` to ensure no syntax or React errors were introduced.
  - [x] Review changes via `git diff` or logs.
- [ ] **Completion**
  - [ ] Update walkthrough artifact.
  - [ ] Push changes to `develop`.
