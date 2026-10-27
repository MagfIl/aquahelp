# Security Specification: Suzdal Aqua Portal

## 1. Data Invariants
- `employees`: Must contain valid `id`, `name`, `role` (one of developer, admin, employee), `pin` (4-8 chars).
- `templates`: Must contain valid `id`, `title`, `text`, `categories`.
- `personal_templates`: Must belong to a valid `authorId` and have allowed status values.
- `settings`: Must have valid pricing structure.

## 2. Dirty Dozen Payloads Handled
1. Junk path characters in IDs (blocked via regex validation `^[a-zA-Z0-9_-]+$`).
2. Overlong template text > 5000 chars (blocked via size checks).
3. Missing mandatory fields on creation (blocked via required field checks).
4. Invalid role escalation to random strings (restricted to enum: developer, admin, employee).
5. Unauthorized document creation in catch-all collections (blocked via default deny).
