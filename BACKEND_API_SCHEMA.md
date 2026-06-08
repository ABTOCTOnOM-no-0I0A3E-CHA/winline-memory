# Backend API Schema

REST API for the **«Футбольный мемори»** backend (Sport24 × Winline, WC-2026).
Built on **Litestar**; all DTOs are [msgspec](https://jcristharif.com/msgspec/) structs.

- **Base path:** `/v1`
- **Content type:** `application/json`
- **OpenAPI / Scalar docs:** served at `OPENAPI_PATH` (configurable, e.g. `/schema`) when `OPENAPI_EXISTS=true`.

---

## 1. Response envelope

Every handler return value is wrapped in a tagged `Result` union before serialization
(`backend/internal/result.py`). The tag field is `type`.

### Success — `Ok`
```jsonc
{
  "type": "ok",
  "data": { /* endpoint-specific payload */ }
}
```

### Error — `Err`
```jsonc
{
  "type": "error",
  "error": {
    "code": 403,                 // mirrors the HTTP status code
    "message": "Admin access required",
    "status": "PERMISSION_DENIED", // gRPC-style status string
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "PERMISSION_DENIED",
        "domain": "api",
        "metadata": {}
      }
    ]
  }
}
```

### Error model

Application errors (`backend/app/errors.py`) map to HTTP + gRPC status as follows
(`exc/map.py`, `exc/handler.py`):

| Application error              | error `code`              | HTTP | gRPC `status`        |
|--------------------------------|---------------------------|------|----------------------|
| `InvalidInputError`            | `invalid_input`           | 400  | `INVALID_ARGUMENT`   |
| `AuthenticationRequiredError`  | `authentication_required` | 401  | `UNAUTHENTICATED`    |
| `PermissionDeniedError`        | `permission_denied`       | 403  | `PERMISSION_DENIED`  |
| `NotFoundError`                | `not_found`               | 404  | `NOT_FOUND`          |
| `ConflictError`                | `conflict`                | 409  | `ABORTED`            |
| `AlreadyExistsError`           | `already_exists`          | 409  | `ALREADY_EXISTS`     |
| `ValidationFailedError`        | `validation_failed`       | 422  | `INVALID_ARGUMENT`   |
| `ApplicationError` (base)      | —                         | 500  | `INTERNAL`           |
| unhandled `Exception`          | —                         | 500  | `INTERNAL`           |

Litestar `HTTPException` (e.g. the `NotAuthorizedException` raised by the session
middleware) is rendered into the same `Err` envelope with the matching status.

---

## 2. Endpoint summary

All paths are prefixed with `/v1`. **Auth** = a valid `session` cookie is required
(enforced by middleware). **Admin** = additionally requires `user.is_admin = true`
(enforced inside the handler).

| Method | Path                 | Auth | Admin | Purpose                              |
|--------|----------------------|------|-------|--------------------------------------|
| GET    | `/health`            | —    | —     | Liveness probe                       |
| POST   | `/auth:signIn`       | —    | —     | Log in, issue session cookie         |
| POST   | `/game:start`        | —    | —     | Create an anonymous game session     |
| POST   | `/analytics/events`  | —    | —     | Ingest gameplay analytics events     |
| GET    | `/analytics/summary` | ✅   | ✅    | Aggregated analytics (admin panel)   |
| GET    | `/bonus`             | —    | —     | Read current Winline bonus URL       |
| PUT    | `/bonus`             | ✅   | ✅    | Update the Winline bonus URL         |

> Public routes are marked `exclude_from_auth=True`; the session middleware skips
> authentication for them. Everything else goes through the cookie check.

---

## 3. Endpoints

### 3.1 `GET /v1/health`
Health check. No auth.

**Response `200`** — note: returns the raw dict, **not** wrapped in the `Ok` envelope.
```json
{ "status": "ok" }
```

---

### 3.2 `POST /v1/auth:signIn`
Log in with username/email + password. On success, sets the `session` cookie
(see §4) and returns the user. Public.

Provider is inferred from `username`: contains `@` → `email_password`, else `username_password`.

**Request body**
```jsonc
{
  "username": "admin",            // username or email
  "password": "••••••••",
  "client_device": {              // optional, all fields optional
    "timezone": "Europe/Moscow",
    "screen_width": 1920,
    "pixel_ratio": 2.0,
    "webgl_vendor": "Apple",
    "webgl_renderer": "Apple GPU",
    "hardware_concurrency": 8,
    "device_memory": 8.0,
    "languages": ["ru-RU", "en-US"]
  }
}
```

**Response `200`** — `data` is the `User` DTO:
```jsonc
{
  "type": "ok",
  "data": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "active": true,
    "created_at": "2026-06-02T10:00:00Z",
    "updated_at": "2026-06-02T10:00:00Z"
  }
}
```
Plus a `Set-Cookie: session=…` header.

**Errors**
- `401 authentication_required` — bad credentials / user not found.
- `422 validation_failed` — `"Email not verified"` (login requires `verified_at`).

> Note: the `User` DTO does **not** expose `is_admin`. The frontend cannot tell from
> this response whether the account is an admin — it discovers that by whether
> admin-gated endpoints return `200` vs `403`.

---

### 3.3 `POST /v1/game:start`
Create a new anonymous game session and return its token. The returned `token` is
later used as `game_session_token` for analytics ingest. Public.

UTM params and client IP / User-Agent are captured server-side.

**Request body** (all optional)
```jsonc
{
  "utm_source": "vk",
  "utm_medium": "cpc",
  "utm_campaign": "wc2026",
  "utm_content": "banner_a",
  "utm_term": "memory"
}
```

**Response `201`** — `data` is the `GameSession` DTO:
```jsonc
{
  "type": "ok",
  "data": {
    "id": "uuid",
    "token": "opaque-session-token",
    "created_at": "2026-06-02T10:00:00Z"
  }
}
```

**Errors**
- `409 already_exists` — `"Game session token collision"` (extremely rare).

---

> **Analytics authorization split**
> - **Writing** events (`POST /analytics/events`) is **not** admin-gated and needs **no
>   user session** — the only requirement is a *real, existing* `game_session_token`
>   (an unknown token returns `404`).
> - **Reading** analytics (`GET /analytics/summary`) is **strictly admin** — classic
>   session-cookie auth + `is_admin`. No changes to this.

### 3.4 `POST /v1/analytics/events`
Bulk-ingest gameplay events for a game session. Public — authorized **only** by the
`game_session_token` in the body (must reference an existing game session), not by a
user session.

**Request body**
```jsonc
{
  "game_session_token": "opaque-session-token",
  "events": [ /* tagged union, see below */ ]
}
```

Each event is a **tagged struct** discriminated by `type`. Supported event types
(`AnalyticsEventType`) and their fields:

| `type`               | Extra fields                                   |
|----------------------|------------------------------------------------|
| `level_started`      | `level: int`                                   |
| `level_completed`    | `level: int`, `moves: int`, `duration_ms: int` |
| `special_pair_found` | `level: int`                                   |
| `hint_used`          | `level: int`                                   |
| `game_completed`     | `total_moves: int`, `total_duration_ms: int`   |
| `bonus_clicked`      | `placement: BonusPlacement`                    |
| `replayed`           | _(none)_                                       |
| `shared`             | `channel: ShareChannel`                        |

`BonusPlacement` = `level_popup` \| `special_popup` \| `final_screen`
`ShareChannel` = `vk` \| `ok` \| `tg`

Example:
```jsonc
{
  "game_session_token": "opaque-session-token",
  "events": [
    { "type": "level_started", "level": 1 },
    { "type": "level_completed", "level": 1, "moves": 12, "duration_ms": 30500 },
    { "type": "bonus_clicked", "placement": "final_screen" },
    { "type": "shared", "channel": "tg" }
  ]
}
```

**Response `201`** — `data` is the `IngestAck` DTO:
```jsonc
{ "type": "ok", "data": { "accepted": 4 } }
```

**Errors**
- `404 not_found` — `"Game session not found"` (unknown `game_session_token`).

---

### 3.5 `GET /v1/analytics/summary`  🔒 admin
Aggregated analytics for the admin dashboard. **Requires auth + admin** (see §5).

**Query params** (optional)
- `date_from` — ISO-8601 datetime, inclusive lower bound.
- `date_to` — ISO-8601 datetime, inclusive upper bound.

**Response `200`** — `data` is the `AnalyticsSummary` DTO:
```jsonc
{
  "type": "ok",
  "data": {
    "total_sessions": 1234,
    "total_events": 56789,
    "events_by_type": { "level_started": 4000, "shared": 120 },
    "game_completions": 870,
    "avg_levels_per_session": 4.2,
    "level_durations": [
      {
        "level": 1,
        "completions": 1100,
        "avg_duration_ms": 28000,
        "min_duration_ms": 9000,
        "max_duration_ms": 120000
      }
    ],
    "bonus_clicks": 430,
    "shares_by_channel": { "vk": 60, "tg": 50, "ok": 10 }
  }
}
```

**Errors**
- `401` — no/invalid session cookie (from middleware).
- `403 permission_denied` — authenticated but `is_admin = false`.

---

### 3.6 `GET /v1/bonus`
Read the current Winline bonus link. Public.

Resolution order: DB `Setting` with key `bonus_url` → falls back to the `BONUS_URL`
config/env value if the setting row doesn't exist.

**Response `200`** — `data` is the `Bonus` DTO:
```jsonc
{ "type": "ok", "data": { "url": "https://winline.ru/bonus/..." } }
```

---

### 3.7 `PUT /v1/bonus`  🔒 admin
Update the Winline bonus link (upserts the `bonus_url` `Setting`).
**Requires auth + admin** (see §5).

**Request body**
```jsonc
{ "url": "https://winline.ru/bonus/new" }
```

**Response `200`** — `data` is the `Bonus` DTO:
```jsonc
{ "type": "ok", "data": { "url": "https://winline.ru/bonus/new" } }
```

**Errors**
- `401` — no/invalid session cookie (from middleware).
- `403 permission_denied` — authenticated but `is_admin = false`.

---

## 4. Authentication — session cookie

Implemented by `SessionMiddleware`
(`backend/entry/rest/common/middlewares/session.py`), which wraps the whole app.

**Flow**
1. For every request, the middleware checks the route's `exclude_from_auth` opt.
   - If set (public route) → authentication is skipped entirely.
   - Otherwise → the route is protected and the cookie check below runs.
2. Read the `session` cookie. **No cookie → `401` `"Session cookie not found"`.**
3. SHA-256 hash the raw token and look up the `Session` by `token_hash`
   (`SessionService.resolve_session`).
   - Not found → `401` `"Invalid or expired session"`.
   - Expired (`expires_at <= now`) → the session row is deleted → `401`.
   - Valid → `last_active_at` is bumped, and the resolved session is attached to the
     request as `scope["auth"]` (a `Session` DTO that carries `user_id`).
4. On `signIn`, the handler generates a fresh raw token, stores its hash, and the
   middleware's send-wrapper emits a `Set-Cookie` header with the new token.

**Session token** — a random opaque secret; only its SHA-256 hash is persisted
(`SecretTokenGenerator`). Absolute TTL is **14 days** (`SessionConfig.SESSION_TTL_DAYS`);
there is no sliding renewal of expiry, only `last_active_at` is updated.

**Cookie attributes** (defaults; configurable on the middleware)

| Attribute  | Default                                            |
|------------|----------------------------------------------------|
| Name       | `session` (prefixed `__Host-` when `secure=True`)  |
| `HttpOnly` | `true`                                             |
| `Secure`   | `false` (set `true` in production / HTTPS)         |
| `SameSite` | `Lax`                                              |
| `Path`     | `/`                                                |
| `Max-Age`  | `1209600` (14 days)                                |

> **CORS:** `allow_credentials=true` with an explicit origin allow-list
> (`CORS_ALLOW_ORIGINS`). For a cross-site admin panel the cookie must be sent with
> `credentials: 'include'`, and in production the cookie needs `Secure` + `SameSite=None`.

---

## 5. Authorization — how admin requests are gated

Admin protection is **two independent layers**:

### Layer 1 — Authentication (middleware)
The `SessionMiddleware` (§4) guarantees a non-public route has a valid session before
the handler runs, and attaches `scope["auth"]` (a `Session` DTO with `user_id`).
This proves *who* the caller is, not *whether* they're an admin.

### Layer 2 — Admin check (inside the handler)
There is **no separate admin middleware or role guard**. The admin check lives in the
use-case handler:

1. The controller reads the authenticated user id from the request scope and passes it
   into the command:
   ```python
   auth: SessionDTO = request.scope["auth"]
   return await handler(UpdateBonusCommand(
       requesting_user_id=UUID(str(auth.user_id)),
       url=data.url,
   ))
   ```
2. The handler loads the `User` by id and checks the `is_admin` flag, raising
   `PermissionDeniedError` (→ `403`) if it's not set:
   ```python
   user = (await self.db.gateway.user.get_by_id(cmd.requesting_user_id)).some(
       AuthenticationRequiredError()
   )
   if not user.is_admin:
       raise PermissionDeniedError(message="Admin access required")
   ```

`is_admin` is a boolean column on the `users` table (`domain/entities/user.py`),
defaulting to `false`.

**Endpoints applying this pattern:** `GET /v1/analytics/summary`
(`GetSummaryHandler`) and `PUT /v1/bonus` (`UpdateBonusHandler`).

### Outcome matrix for an admin-gated endpoint

| Caller state                         | Result                          |
|--------------------------------------|---------------------------------|
| No / invalid / expired session cookie | `401` `authentication_required` (middleware) |
| Valid session, `is_admin = false`     | `403` `permission_denied` ("Admin access required") |
| Valid session, `is_admin = true`      | `200` with the payload          |

> Because each handler does its own check, adding a new admin endpoint means
> repeating the `requesting_user_id` → load user → `is_admin` pattern. There is
> currently no `is_admin` field in the `User` response DTO, no `/auth:me`, and no
> logout endpoint (see `docs/ADMIN_FRONTEND_API_SPEC.md`).
