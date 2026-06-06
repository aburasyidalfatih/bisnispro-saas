# Task List: Fix Shadcn Button Color Clashes

- [ ] **Fix Specific Files**
  - [ ] Fix `storage-tab.tsx` (Add `variant="outline"` to Storage Provider buttons)
  - [ ] Fix `general-tab.tsx` (Add `variant="outline"` to Security & Feature toggle buttons)
  - [ ] Fix `educational-emails/page.tsx` (Add `variant="ghost"` to sequence menu buttons)

- [ ] **Global Sweeping Script**
  - [ ] Write a script to find `<Button` elements that contain `className={cn(...)}` and have complex `flex`, `p-`, `border` classes, and inject `variant="outline"` or `variant="ghost"` if no variant is present.
  - [ ] Execute script on the dashboard scope.

- [ ] **Verification**
  - [ ] Run `npx next build` locally.
  - [ ] Verify everything compiles successfully.
