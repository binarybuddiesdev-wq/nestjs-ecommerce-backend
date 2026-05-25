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
    AUTH = 'auth',
    USERS = 'users',
    CATEGORIES = 'categories',
    PRODUCTS = 'products',
    CART = 'cart',
    ORDERS = 'orders',
    PAYMENTS = 'payments',
    REVIEWS = 'reviews',
    COUPONS = 'coupons',
    NOTIFICATIONS = 'notifications',
}

export enum APIOperation {
    HEALTH_CHECK = 'Health check',
    AUTH_REGISTER = 'Register a new user',
    AUTH_LOGIN = 'Login and get tokens',
    AUTH_REFRESH = 'Refresh access token',
    AUTH_LOGOUT = 'Logout and revoke token',
    AUTH_ME = 'Get current user',
}

export const successResponseSchema = (dataSchema: Record<string, unknown>, message: string,) => ({
    schema: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: message },
            data: dataSchema,
        },
    },
})