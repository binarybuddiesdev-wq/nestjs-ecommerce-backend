# Routes — nestjs-ecommerce-backend

## Health

### GET /health
- Auth: No
- Role: Public
- Description: Returns application health status
- Response: `{ status: 'ok' }`

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

## Users (Phase 4)

### GET /api/v1/users/me
- Auth: Yes
- Role: Authenticated
- Description: Returns profile information for the current user
- Response: `{ success: true, message: 'Profile retrieved successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

### PATCH /api/v1/users/me
- Auth: Yes
- Role: Authenticated
- Description: Updates profile name and avatar URL for the current user
- Response: `{ success: true, message: 'Profile updated successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

### DELETE /api/v1/users/me
- Auth: Yes
- Role: Authenticated
- Description: Soft deletes / deactivates the current user's account and revokes their active refresh tokens
- Response: `{ success: true, message: 'Account deactivated successfully', data: {} }`

### POST /api/v1/users/me/become-seller
- Auth: Yes
- Role: Authenticated
- Description: Promotes the current user's role to SELLER
- Response: `{ success: true, message: 'Seller role request submitted successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

### POST /api/v1/users/me/address
- Auth: Yes
- Role: Authenticated
- Description: Adds a new address to the user's list
- Response: `{ success: true, message: 'Address added successfully', data: { id, email, role, name, avatar, address: [...], isActive, createdAt, updatedAt } }`

### GET /api/v1/users/me/address
- Auth: Yes
- Role: Authenticated
- Description: Lists all addresses for the current user
- Response: `{ success: true, message: 'Addresses retrieved successfully', data: [ { id, label, street, city, state, zipCode, country, isDefault } ] }`

### PATCH /api/v1/users/me/address/:id
- Auth: Yes
- Role: Authenticated
- Description: Updates an address by its ID
- Response: `{ success: true, message: 'Address updated successfully', data: { id, email, role, name, avatar, address: [...], isActive, createdAt, updatedAt } }`

### DELETE /api/v1/users/me/address/:id
- Auth: Yes
- Role: Authenticated
- Description: Deletes an address by its ID
- Response: `{ success: true, message: 'Address deleted successfully', data: { id, email, role, name, avatar, address: [...], isActive, createdAt, updatedAt } }`

### POST /api/v1/users/me/avatar
- Auth: Yes
- Role: Authenticated
- Description: Uploads a profile avatar using multipart file upload, saved via Cloudinary
- Response: `{ success: true, message: 'Avatar uploaded successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

## Admin Users (Phase 4)

### GET /api/v1/admin/users
- Auth: Yes
- Role: Admin
- Description: Lists all registered users in the database
- Response: `{ success: true, message: 'All Users retrieved successfully', data: [ { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } ] }`

### PATCH /api/v1/admin/users/:id/role
- Auth: Yes
- Role: Admin
- Description: Updates a specific user's role
- Response: `{ success: true, message: 'User role updated successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

### DELETE /api/v1/admin/users/:id
- Auth: Yes
- Role: Admin
- Description: Soft deletes / deactivates a user's account and revokes their active refresh tokens
- Response: `{ success: true, message: 'User deleted successfully', data: { id, email, role, name, avatar, address, isActive, createdAt, updatedAt } }`

## Categories (Phase 5)

### GET /api/v1/categories
- Auth: No
- Role: Public
- Description: Returns full hierarchical category tree
- Response: `{ success: true, message: 'Category tree retrieved successfully', data: [ { id, name, slug, parentId, isActive, createdAt, updatedAt, children: [...] } ] }`

### GET /api/v1/categories/:slug
- Auth: No
- Role: Public
- Description: Returns a single category by slug
- Response: `{ success: true, message: 'Category retrieved successfully', data: { id, name, slug, parentId, isActive, createdAt, updatedAt } }`

## Admin — Categories (Phase 5)

### POST /api/v1/admin/categories
- Auth: Yes
- Role: ADMIN
- Description: Creates a new top-level or sub-category. Slug is auto-generated from name.
- Request: `{ name: string, parentId?: string }`
- Response: `{ success: true, message: 'Category created successfully', data: { id, name, slug, parentId, isActive, createdAt, updatedAt } }`

### PATCH /api/v1/admin/categories/:id
- Auth: Yes
- Role: ADMIN
- Description: Updates a category's name, slug, or isActive flag
- Request: `{ name?: string, slug?: string, isActive?: boolean }`
- Response: `{ success: true, message: 'Category updated successfully', data: { id, name, slug, parentId, isActive, createdAt, updatedAt } }`

### DELETE /api/v1/admin/categories/:id
- Auth: Yes
- Role: ADMIN
- Description: Soft-deletes a category (sets isActive to false). Children are unlinked (parentId set to null).
- Response: `{ success: true, message: 'Category deleted successfully', data: { id, name, slug, parentId, isActive, createdAt, updatedAt } }`
