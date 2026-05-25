# Routes — nestjs-ecommerce-backend

## Health

### GET /health
- Auth: No
- Role: Public
- Description: Returns application health status
- Response: { status: 'ok' }

## Auth

### POST /api/v1/auth/register
- Auth: No
- Role: Public
- Description: Registers a new user account
- Response: `{ success: true, message: 'User registered successfully', data: { id, email, role, createdAt, updatedAt } }`

### POST /api/v1/auth/login
- Auth: No
- Role: Public
- Description: Validates credentials and returns JWT access and refresh tokens
- Response: `{ success: true, message: 'User logged in successfully', data: { user, accessToken, refreshToken } }`

### POST /api/v1/auth/refresh
- Auth: No
- Role: Public
- Description: Rotates a refresh token and returns a new token pair
- Response: `{ success: true, message: 'Token refreshed successfully', data: { accessToken, refreshToken } }`

### POST /api/v1/auth/logout
- Auth: Yes
- Role: Authenticated
- Description: Revokes all active refresh tokens for the current user
- Response: `{ success: true, message: 'Logged out successfully', data: {} }`

### GET /api/v1/auth/me
- Auth: Yes
- Role: Authenticated
- Description: Returns profile information for the current user
- Response: `{ success: true, message: 'User fetched successfully', data: { id, email, role, createdAt, updatedAt } }`
