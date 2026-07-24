# Data Model: Login Redesign

## User Credentials

This feature does not introduce new database tables or persistent state structures, but relies on the existing authentication model. The primary transient entity is `User Credentials`.

### Fields

- `username` (string): The user's account identifier (email, phone, or custom username).
- `password` (string): The user's secret key.
- `rememberMe` (boolean): Flag indicating whether the session token should be persisted across app restarts via local storage.

### Validations

- Both `username` and `password` are required before submitting.
- Validation happens on the client side (empty check) and server side (authentication check).
