import {
    successResponseSchema,
    CART_ITEM_ADDED_SUCCESS as CONST_CART_ITEM_ADDED_SUCCESS,
    CART_RETRIEVED_SUCCESS as CONST_CART_RETRIEVED_SUCCESS,
    CART_ITEM_UPDATED_SUCCESS as CONST_CART_ITEM_UPDATED_SUCCESS,
    CART_ITEM_REMOVED_SUCCESS as CONST_CART_ITEM_REMOVED_SUCCESS,
    CART_CLEARED_SUCCESS as CONST_CART_CLEARED_SUCCESS,
} from "@/common/constants/api.constants.js";

const CART_ITEM_ADDED_SUCCESS = CONST_CART_ITEM_ADDED_SUCCESS;
const CART_RETRIEVED_SUCCESS = CONST_CART_RETRIEVED_SUCCESS;
const CART_ITEM_UPDATED_SUCCESS = CONST_CART_ITEM_UPDATED_SUCCESS;
const CART_ITEM_REMOVED_SUCCESS = CONST_CART_ITEM_REMOVED_SUCCESS;
const CART_CLEARED_SUCCESS = CONST_CART_CLEARED_SUCCESS;

export const cartItemProductSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        images: { type: 'array', items: { type: 'string' } },
        stock: { type: 'number' },
        isActive: { type: 'boolean' },
        slug: { type: 'string' },
    },
};

export const cartItemSchema = {
    type: 'object',
    properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
    },
};

export const cartItemWithProductSchema = {
    type: 'object',
    properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
        product: cartItemProductSchema,
    },
};

export const cartDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        items: {
            type: 'array',
            items: cartItemWithProductSchema,
        },
        totalAmount: { type: 'number' },
        totalItems: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const AddCartItemResponse = {
    status: 201,
    description: CART_ITEM_ADDED_SUCCESS,
    ...successResponseSchema(cartDataSchema, CART_ITEM_ADDED_SUCCESS),
};

export const GetCartResponse = {
    status: 200,
    description: CART_RETRIEVED_SUCCESS,
    ...successResponseSchema(cartDataSchema, CART_RETRIEVED_SUCCESS),
};

export const UpdateCartItemResponse = {
    status: 200,
    description: CART_ITEM_UPDATED_SUCCESS,
    ...successResponseSchema(cartDataSchema, CART_ITEM_UPDATED_SUCCESS),
};

export const RemoveCartItemResponse = {
    status: 200,
    description: CART_ITEM_REMOVED_SUCCESS,
    ...successResponseSchema(cartDataSchema, CART_ITEM_REMOVED_SUCCESS),
};

export const ClearCartResponse = {
    status: 200,
    description: CART_CLEARED_SUCCESS,
    ...successResponseSchema(cartDataSchema, CART_CLEARED_SUCCESS),
};

export const addCartItemBodySchema = {
    schema: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
            productId: { type: 'string', description: 'Product ID' },
            quantity: { type: 'number', minimum: 1, description: 'Quantity to add' },
        },
    },
};

export const updateCartItemBodySchema = {
    schema: {
        type: 'object',
        required: ['quantity'],
        properties: {
            quantity: { type: 'number', minimum: 1, description: 'New quantity' },
        },
    },
};

export const removeCartItemsBodySchema = {
    schema: {
        type: 'object',
        required: ['productIds'],
        properties: {
            productIds: {
                type: 'array',
                items: { type: 'string', description: 'Product ID to remove' },
                description: 'Single product ID or array of product IDs to remove from cart',
                example: ['productId1', 'productId2'],
            },
        },
    },
};
