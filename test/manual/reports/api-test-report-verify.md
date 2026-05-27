# API Verification Report — Independent Cross Check
Date: 2026-05-27
Tester: Antigravity AI
Previous Report: test/manual/api-test-report.md (by OpenCode AI)
Server: http://localhost:3000
Total Tests: 26
Passed: 25
Failed: 1

## Results

### Health
| # | Method | Endpoint | Expected | Actual | Status |
|---|--------|----------|----------|--------|--------|
| 1 | GET | /health | 200 | 200 | ✅ PASS |

### Auth
| # | Method | Endpoint | Expected | Actual | Status |
|---|--------|----------|----------|--------|--------|
| 2 | POST | /api/v1/auth/register | 201 | 201 | ✅ PASS |
| 3 | POST | /api/v1/auth/register | 409 | 409 | ✅ PASS |
| 4 | POST | /api/v1/auth/register | 201 | 201 | ✅ PASS |
| 5 | POST | /api/v1/auth/login | 200 | 200 | ✅ PASS |
| 6 | POST | /api/v1/auth/login | 401 | 401 | ✅ PASS |
| 7 | GET | /api/v1/auth/me | 200 | 200 | ✅ PASS |
| 8 | POST | /api/v1/auth/refresh | 200 | 200 | ✅ PASS |
| 9 | POST | /api/v1/auth/refresh | 401 | 401 | ✅ PASS |
| 10 | POST | /api/v1/auth/logout | 200 | 200 | ✅ PASS |
| 11 | POST | /api/v1/auth/login | 200 | 200 | ✅ PASS |
| 21 | POST | /api/v1/auth/login | 200 | 200 | ✅ PASS |
| 23 | POST | /api/v1/auth/login | 401 or 403 | 200 | ❌ FAIL |

### Users
| # | Method | Endpoint | Expected | Actual | Status |
|---|--------|----------|----------|--------|--------|
| 12 | GET | /api/v1/users/me | 200 | 200 | ✅ PASS |
| 13 | PATCH | /api/v1/users/me | 200 | 200 | ✅ PASS |
| 14 | POST | /api/v1/users/me/address | 200 | 200 | ✅ PASS |
| 15 | GET | /api/v1/users/me/address | 200 | 200 | ✅ PASS |
| 16 | PATCH | /api/v1/users/me/address/:id | 200 | 200 | ✅ PASS |
| 17 | DELETE | /api/v1/users/me/address/:id | 200 | 200 | ✅ PASS |
| 22 | DELETE | /api/v1/users/me | 200 | 200 | ✅ PASS |

### Seller Onboarding
| # | Method | Endpoint | Expected | Actual | Status |
|---|--------|----------|----------|--------|--------|
| 18 | POST | /api/v1/auth/login | 200 | 200 | ✅ PASS |
| 19 | POST | /api/v1/users/me/become-seller | 200 | 200 | ✅ PASS |
| 20 | POST | /api/v1/users/me/become-seller | 400 or 409 | 400 | ✅ PASS |

### Admin Access Control
| # | Method | Endpoint | Expected | Actual | Status |
|---|--------|----------|----------|--------|--------|
| 24 | GET | /api/v1/admin/users | 403 | 403 | ✅ PASS |
| 25 | PATCH | /api/v1/admin/users/:id/role | 403 | 403 | ✅ PASS |
| 26 | DELETE | /api/v1/admin/users/:id | 403 | 403 | ✅ PASS |

## Cross Verification Findings

### Finding 1 — Logout returning 500
- **OpenCode finding:** OpenCode reported that `POST /api/v1/auth/logout` returned HTTP 500, attributing it to a server-side bug in the logout endpoint.
- **My result:** Returned HTTP 200 (Success).
- **Verdict:** DISPUTED
- **Details:** The logout endpoint itself does not crash and works as expected. The 500 error OpenCode encountered was a side-effect of rate limiting. The NestJS application limits the number of requests to `/api/v1/auth/*` endpoints to 10 per minute. OpenCode ran its tests back-to-back, causing this limit to be exceeded on the 10th request (logout). Fastify's rate limiter threw an exception, which was then caught by `GlobalExceptionFilter` and improperly mapped to a 500 status code. With a 7-second sleep delay between requests to remain below the rate limit, the endpoint returned a clean 200 success response.

### Finding 2 — Login returning 500 after logout
- **OpenCode finding:** OpenCode reported that attempting to login after logging out returned HTTP 500, claiming this was a cascading failure after the logout bug.
- **My result:** Returned HTTP 200 (Success).
- **Verdict:** DISPUTED
- **Details:** This was not a cascading logical failure, but rather the same rate limit blocking. Because the sliding window was still blocked from exceeding the limit of 10 requests per minute on auth routes, the re-login attempt triggered the rate-limiter, which returned a 500 Internal Server Error due to the global exception filter mapping. With appropriate delays, the re-login succeeded cleanly.

### Finding 3 — Login with soft deleted account returning 500
- **OpenCode finding:** OpenCode reported that trying to log in to a soft-deleted account returned HTTP 500, suggesting that the login endpoint does not handle soft-deleted accounts gracefully.
- **My result:** Returned HTTP 200 (Success).
- **Verdict:** DIFFERENT BEHAVIOR
- **Details:** The 500 error OpenCode saw was again due to rate-limit exhaustion. When rate limiting is bypassed, the login attempt actually succeeds and returns a 200 status code with valid access and refresh tokens. This is a significant functional security bug: the authentication logic (`AuthService.login` and `JwtStrategy.validate`) completely lacks checks on the `isActive` column. Therefore, soft-deleted users (where `isActive` is set to `false`) can still successfully authenticate and use the API.

## Failed Tests Detail

### Test 23: POST /api/v1/auth/login (try login with deleted account)
- **What was sent:** A POST request to `/api/v1/auth/login` containing the credentials of a soft-deleted account (`verify.customer@example.com`).
- **What was expected:** HTTP 401 (Unauthorized) or HTTP 403 (Forbidden) since the account was soft-deleted (`isActive: false`) in Test 22.
- **What was received:** HTTP 200 (OK) along with newly generated JWT access and refresh tokens.
- **Possible root cause:** The `AuthService.login` method and `JwtStrategy.validate` verify credentials against the database but do not check whether the user's `isActive` flag is true.

## Bugs Confirmed
No bugs reported by OpenCode were confirmed as actual logical failures in those specific endpoints. However, an underlying framework bug is confirmed:
1. **GlobalExceptionFilter Mismatch on Rate Limits:** When `@fastify/rate-limit` triggers, it throws a rate limit error that is not an instance of `HttpException`. Because of this, `GlobalExceptionFilter` catches it and defaults to status `500 Internal server error` with message `"Internal server error"` instead of returning `429 Too Many Requests`.

## Disputed Findings
1. **POST /api/v1/auth/logout returns 500:** Not a logical bug. It works cleanly when rate limits are respected.
2. **Login returning 500 after logout:** Not a logical bug. Subsequent login attempts work cleanly when rate limits are respected.
3. **Login with soft-deleted account returning 500:** The login does not fail with 500. It succeeds with 200 due to missing status verification.

## New Findings
1. **Soft-Deleted Accounts Can Login:** User accounts that are soft-deleted (`isActive: false`) are not prevented from logging in. `AuthService.login` and `JwtStrategy` must check the `isActive` state of the user.
2. **Shared Rate Limiting Counter Across Endpoints:** The rate limiter's count is incremented on *all* endpoints globally per IP, rather than being scoped per endpoint. This means calling non-auth endpoints (e.g. `/users/me/address`) uses up the rate limit quota (10 requests) of the `/auth/` routes if they share the same window, causing premature rate limiting.

## Recommendation
The following fixes must be implemented:
1. **Fix Rate Limit Exception Mapping:** Update `GlobalExceptionFilter` (in `src/common/filters/http-exception.filter.ts`) to detect Fastify-level errors (like `exception.statusCode === 429` or error name containing `RateLimitError`) and map them to HTTP 429 status and message instead of HTTP 500.
2. **Implement User Account Activation Check:** Update `AuthService.login` and `JwtStrategy.validate` to verify that `user.isActive` is `true`. If `user.isActive` is `false`, throw an `UnauthorizedException` (or `ForbiddenException`) to prevent soft-deleted users from logging in or calling authenticated endpoints.
