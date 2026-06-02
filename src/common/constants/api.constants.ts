export enum ApiTags {
    HEALTH = 'Health',
    AUTH = 'Auth',
    USERS = 'Users',
    CATEGORIES = 'Categories',
    PRODUCTS = 'Products',
    UPLOADS = 'Uploads',
    CART = 'Cart',
    ORDERS = 'Orders',
    PAYMENTS = 'Payments',
    REVIEWS = 'Reviews',
    COUPONS = 'Coupons',
    NOTIFICATIONS = 'Notifications',
}

export enum ApiRoutes {
    HEALTH = 'health',
    REGISTER = 'register',
    LOGIN = 'login',
    REFRESH = 'refresh',
    LOGOUT = 'logout',
    ME = 'me',
    BECOME_SELLER = 'me/become-seller',
    ADDRESS = 'me/address',
    ADDRESS_BY_ID = 'me/address/:id',
    ADMIN = 'admin',
    ADMIN_USERS = 'admin/users',
    ADMIN_USER_BY_ID = ':id',
    ADMIN_USER_ROLE = ':id/role',
    UPLOAD_AVATAR = 'me/avatar',
    CATEGORIES = 'categories',
    ADMIN_CATEGORIES = 'admin/categories',
    CATEGORY_BY_SLUG = ':slug',
    PRODUCTS = 'products',
    PRODUCT_BY_SLUG = ':slug',
    PRODUCT_BY_ID = ':id',
    SELLER_PRODUCTS = 'seller/products',
    ADMIN_PRODUCTS = 'admin/products',
    PRODUCT_IMAGES = ':id/images',
    PRODUCT_IMAGE_BY_INDEX = ':id/images/:index',
    PRODUCT_RELATED = ':id/related',
    PRODUCT_RELATED_BY_ID = ':id/related/:relatedId',
    UPLOADS = 'uploads',
}

export enum ApiOperation {
    HEALTH_CHECK = 'Health check',
    AUTH_REGISTER = 'Register a new user',
    AUTH_LOGIN = 'Login and get tokens',
    AUTH_REFRESH = 'Refresh access token',
    AUTH_LOGOUT = 'Logout and revoke token',
    AUTH_ME = 'Get current user',
    USERS_GET_ME = 'Get Own Profile',
    USERS_UPDATE_ME = 'Update Own Profile',
    USERS_DELETE_ME = 'Soft delete own account',
    USERS_BECOME_SELLER = 'Request seller role',
    USERS_ADD_ADDRESS = 'Add Address',
    USERS_LIST_ADDRESSES = 'List Addresses',
    USERS_UPDATE_ADDRESS = 'Update Address',
    USERS_DELETE_ADDRESS = 'Delete Address',
    USERS_UPLOAD_AVATAR = 'Upload avatar',
    ADMIN_LIST_USERS = 'List All Users (Admin)',
    ADMIN_UPDATE_USER_ROLE = 'Update User Role (Admin)',
    ADMIN_DELETE_USER = 'Delete User (Admin)',
    CATEGORY_CREATE = 'Create a new category',
    CATEGORY_GET_TREE = 'Get full category tree',
    CATEGORY_GET_BY_SLUG = 'Get category by slug',
    CATEGORY_UPDATE = 'Update a category',
    CATEGORY_DELETE = 'Delete a category',
    PRODUCT_CREATE = 'Create a new product',
    PRODUCT_LIST = 'List all active products',
    PRODUCT_GET_BY_SLUG = 'Get product by slug',
    PRODUCT_UPDATE = 'Update a product',
    PRODUCT_DELETE = 'Delete a product',
    SELLER_LIST_PRODUCTS = 'List own products (Seller)',
    ADMIN_LIST_PRODUCTS = 'List all products (Admin)',
    UPLOAD_IMAGES = 'Upload images',
    PRODUCT_ADD_IMAGES = 'Add images to product',
    PRODUCT_REMOVE_IMAGE = 'Remove image from product',
    PRODUCT_GET_RELATED = 'Get related products',
    PRODUCT_SET_RELATED = 'Set related products',
    PRODUCT_REMOVE_RELATED = 'Remove a related product',
}

export const HEALTH_SUCCESS_MESSAGE = 'Health check passed';

// Auth Success Messages
export const REGISTER_SUCCESS = 'User registered successfully';
export const LOGIN_SUCCESS = 'User logged in successfully';
export const ME_SUCCESS = 'User fetched successfully';
export const REFRESH_SUCCESS = 'Token refreshed successfully';
export const LOGOUT_SUCCESS = 'Logged out successfully';

// Users Success Messages
export const GET_ME_SUCCESS = 'Profile retrieved successfully';
export const UPDATE_ME_SUCCESS = 'Profile updated successfully';
export const DELETE_ME_SUCCESS = 'Account deactivated successfully';
export const BECOME_SELLER_SUCCESS = 'Seller role request submitted successfully';
export const ADD_ADDRESS_SUCCESS = 'Address added successfully';
export const LIST_ADDRESSES_SUCCESS = 'Addresses retrieved successfully';
export const UPDATE_ADDRESS_SUCCESS = 'Address updated successfully';
export const DELETE_ADDRESS_SUCCESS = 'Address deleted successfully';
export const LIST_ALL_USERS_SUCCESS = 'All Users retrieved successfully';
export const UPDATE_USER_ROLE_SUCCESS = 'User role updated successfully';
export const DELETE_ADMIN_USER_SUCCESS = 'User deleted successfully';
export const AVATAR_UPLOAD_SUCCESS = 'Avatar uploaded successfully';
export const UPLOAD_SUCCESS = 'Images uploaded successfully';
export const CATEGORY_CREATED_SUCCESS = 'Category created successfully';
export const CATEGORY_TREE_SUCCESS = 'Category tree retrieved successfully';
export const CATEGORY_FETCHED_SUCCESS = 'Category retrieved successfully';
export const CATEGORY_UPDATED_SUCCESS = 'Category updated successfully';
export const CATEGORY_DELETED_SUCCESS = 'Category deleted successfully';

// Product Success Messages
export const PRODUCT_CREATED_SUCCESS = 'Product created successfully';
export const PRODUCT_LIST_SUCCESS = 'Products retrieved successfully';
export const PRODUCT_FETCHED_SUCCESS = 'Product retrieved successfully';
export const PRODUCT_UPDATED_SUCCESS = 'Product updated successfully';
export const PRODUCT_DELETED_SUCCESS = 'Product deleted successfully';
export const SELLER_PRODUCTS_SUCCESS = 'Seller products retrieved successfully';
export const ADMIN_PRODUCTS_SUCCESS = 'All products retrieved successfully';
export const PRODUCT_IMAGES_ADDED_SUCCESS = 'Images added to product successfully';
export const PRODUCT_IMAGE_REMOVED_SUCCESS = 'Image removed from product successfully';
export const PRODUCT_RELATED_SUCCESS = 'Related products retrieved successfully';
export const PRODUCT_RELATED_SET_SUCCESS = 'Related products updated successfully';
export const PRODUCT_RELATED_REMOVED_SUCCESS = 'Related product removed successfully';

// Error Messages
export const EMAIL_IN_USE = 'Email already in use';
export const INVALID_CREDENTIALS = 'Invalid credentials';
export const INVALID_REFRESH_TOKEN = 'Invalid refresh token';
export const USER_NO_LONGER_EXISTS = 'User no longer exists';
export const USER_NOT_FOUND = 'User not found';
export const ALREADY_SELLER = 'Cannot become a seller as you are already a seller';
export const ADDRESS_NOT_FOUND = 'Address not found';
export const USER_ALREADY_INACTIVE = 'User is already inactive';
export const NO_FILE_UPLOADED = 'No file uploaded';
export const ACCESS_DENIED = 'Access denied';
export const INSUFFICIENT_PERMISSIONS = 'Insufficient permissions';
export const CATEGORY_NOT_FOUND = 'Category not found';
export const CATEGORY_SLUG_EXISTS = 'Category slug already exists';
export const PARENT_CATEGORY_NOT_FOUND = 'Parent category not found';
export const CATEGORY_HAS_PRODUCTS = 'Cannot delete category with active products';
export const PRODUCT_NOT_FOUND = 'Product not found';
export const PRODUCT_SLUG_EXISTS = 'Product slug already exists';
export const RELATED_PRODUCT_NOT_FOUND = 'One or more related products not found';
export const PRODUCT_NOT_OWNER = 'You can only modify your own products';
export const CATEGORY_NOT_ACTIVE = 'Selected category is not active';
export const INVALID_IMAGE_INDEX = 'Invalid image index';

export const successResponseSchema = (dataSchema: Record<string, unknown>, message: string) => ({
    schema: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: message },
            data: dataSchema,
        },
    },
});