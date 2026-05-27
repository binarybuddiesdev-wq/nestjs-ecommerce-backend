# Manual API Testing

This folder contains scripts and reports for manual API testing.
Used to verify all endpoints are working correctly at any phase.
Organized and verified as part of Phase 4 (Users & Seller Onboarding).

## How to Use

### Prerequisites
Server must be running:
    pnpm run start:dev

### Step 1 — Clean the database test users
This removes only the test users created by the scripts.
Never touches real data.
    node --env-file=.env test/manual/scripts/cleanup-db.js

### Step 2 — Run the API tests
Add a delay between requests to avoid rate limiting.
    node test/manual/scripts/run-api-tests.js

### Step 3 — Check the report
Results are printed to console and saved to:
    test/manual/reports/

## What Gets Tested
- Health endpoint
- Auth — register, login, refresh, logout, me
- Users — profile, addresses, become-seller, soft delete
- Admin access control — 403 for non-admins

## Adding New Tests
When new phases are complete add new test cases to
test/manual/scripts/run-api-tests.js following the same pattern.
Update this README with what the new tests cover.

## Known Behaviors
- Auth endpoints have stricter rate limiting — add delays between requests
- Admin positive tests require an admin token which must be created
  manually via database or seeding — document how to do this when
  seed script is added in Phase 13
- Soft deleted accounts correctly return 401 on login (fixed in Phase 4)
- Rate limit errors correctly return 429 (fixed in Phase 4)
