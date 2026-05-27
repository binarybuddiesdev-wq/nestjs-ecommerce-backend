export enum ApiTags {
    HEALTH = 'Health',
    AUTH = 'Auth',
    USERS = 'Users',
    CATEGORIES = 'Categories',
    PRODUCTS = 'Products',
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