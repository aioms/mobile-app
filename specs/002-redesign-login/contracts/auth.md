# API Contracts: Auth

This feature redesigns the UI but does not introduce new API contracts. It will continue to use the existing login hook provided by the `useAuth` custom hook in the codebase.

## POST `/auth/login` (Abstracted by `useAuth().login()`)

### Request

```json
{
  "username": "user123",
  "password": "securepassword"
}
```

### Response (Success)

```json
{
  "statusCode": 200,
  "data": {
    "token": "...",
    "user": { ... }
  },
  "message": "Success"
}
```

### Response (Error)

```json
{
  "statusCode": 401,
  "message": "Invalid username or password"
}
```
