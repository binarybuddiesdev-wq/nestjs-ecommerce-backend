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

## Products (Phase 6)

### POST /api/v1/products
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Creates a new product with optional image uploads (multipart/form-data)
- Response: `{ success: true, message: 'Product created successfully', data: { id, name, slug, description, price, stock, images: [...], categoryId, sellerId, isActive, createdAt, updatedAt } }`

### GET /api/v1/products
- Auth: No
- Role: Public
- Description: Lists active products with filters (category, search, brand, minPrice, maxPrice, tag, inStock, sort, limit, cursor)
- Response: `{ success: true, message: 'Products retrieved successfully', data: { products: [...], cursor, hasMore, total } }`

### GET /api/v1/products/:slug
- Auth: No
- Role: Public
- Description: Retrieves a single active product by its unique slug
- Response: `{ success: true, message: 'Product retrieved successfully', data: { id, name, slug, description, price, stock, images: [...], categoryId, sellerId, isActive, createdAt, updatedAt } }`

### PATCH /api/v1/products/:id
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Updates an existing product's fields with optional image updates. Sellers can only update their own products; admins can update any.
- Response: `{ success: true, message: 'Product updated successfully', data: { id, name, slug, description, price, stock, images: [...], categoryId, sellerId, isActive, createdAt, updatedAt } }`

### DELETE /api/v1/products/:id
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Soft-deletes a product (sets isActive to false). Sellers can only delete their own; admins can delete any.
- Response: `{ success: true, message: 'Product deleted successfully', data: { id, name, slug, description, price, stock, images: [...], categoryId, sellerId, isActive, createdAt, updatedAt } }`

### GET /api/v1/products/seller/products
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Lists products owned by the current seller
- Response: `{ success: true, message: 'Seller products retrieved successfully', data: { products: [...], cursor, hasMore, total } }`

### GET /api/v1/products/admin/products
- Auth: Yes
- Role: ADMIN
- Description: Lists all products in the database, including inactive ones (Admin only)
- Response: `{ success: true, message: 'All products retrieved successfully', data: { products: [...], cursor, hasMore, total } }`

### POST /api/v1/products/:id/images
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Uploads and appends new images to a product
- Response: `{ success: true, message: 'Images added to product successfully', data: { id, name, slug, images: [...] } }`

### DELETE /api/v1/products/:id/images/:index
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Removes an image from the product's image list by its index
- Response: `{ success: true, message: 'Image removed from product successfully', data: { id, name, slug, images: [...] } }`

### GET /api/v1/products/:id/related
- Auth: No
- Role: Public
- Description: Lists active related products for a product
- Response: `{ success: true, message: 'Related products retrieved successfully', data: { products: [ { id, name, slug, price, images, stock } ] } }`

### POST /api/v1/products/:id/related
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Sets the related product IDs for a product
- Request: `{ relatedProductIds: string[] }`
- Response: `{ success: true, message: 'Related products updated successfully', data: { id, name, slug, relatedProductIds: [...] } }`

### DELETE /api/v1/products/:id/related/:relatedId
- Auth: Yes
- Role: SELLER, ADMIN
- Description: Removes a related product relationship from a product
- Response: `{ success: true, message: 'Related product removed successfully', data: { id, name, slug, relatedProductIds: [...] } }`

