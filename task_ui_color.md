# Task List: Fix Shadcn Button Color Clashes

- [x] **Fix Specific Files**
  - [x] Fix `storage-tab.tsx` (Add `variant="outline"` to Storage Provider buttons)
  - [x] Fix `general-tab.tsx` (Add `variant="outline"` to Security & Feature toggle buttons)
  - [x] Fix `educational-emails/page.tsx` (Add `variant="ghost"` to sequence menu buttons)

- [x] **Global Sweeping Script**
  - [x] Write a script to find `<Button` elements that contain `className={cn(...)}` and have complex `flex`, `p-`, `border` classes, and inject `variant="outline"` or `variant="ghost"` if no variant is present.
  - [x] Execute script on the dashboard scope.

- [x] **Verification**
  - [x] Run `npx next build` locally.
  - [x] Verify everything compiles successfully.
