import {
    successResponseSchema,
    PRODUCT_CREATED_SUCCESS,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_FETCHED_SUCCESS,
    PRODUCT_UPDATED_SUCCESS,
    PRODUCT_DELETED_SUCCESS,
    SELLER_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_SUCCESS,
    PRODUCT_RELATED_SUCCESS,
    PRODUCT_RELATED_SET_SUCCESS,
    PRODUCT_RELATED_REMOVED_SUCCESS,
} from '@/common/constants/api.constants.js';

export const CreateProductBody = {
    schema: {
        type: 'object',
        required: ['name', 'description', 'price', 'stock', 'categoryId'],
        properties: {
            name: { type: 'string', example: 'Samsung Galaxy S26' },
            description: { type: 'string', example: 'Latest Samsung flagship with AI features' },
            price: { type: 'number', example: 89999 },
            stock: { type: 'integer', example: 50 },
            categoryId: { type: 'string', example: '6a170fab7ae1efafa7c75f9f' },
            brand: { type: 'string', example: 'Samsung' },
            tags: { type: 'string', example: 'new-arrival,best-seller', description: 'Comma-separated tags' },
            compareAtPrice: { type: 'number', example: 99999 },
            weight: { type: 'number', example: 1.5 },
            dimensions: { type: 'string', example: '30x20x10 cm' },
            warrantyInfo: { type: 'string', example: '2 years manufacturer warranty' },
            expiryDate: { type: 'string', example: '2027-12-31' },
            images: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                nullable: true,
            },
        },
    },
};

export const productDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        brand: { type: 'string', nullable: true },
        price: { type: 'number' },
        compareAtPrice: { type: 'number', nullable: true },
        stock: { type: 'integer' },
        soldCount: { type: 'integer' },
        images: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        weight: { type: 'number', nullable: true },
        dimensions: { type: 'string', nullable: true },
        warrantyInfo: { type: 'string', nullable: true },
        expiryDate: { type: 'string', format: 'date', nullable: true },
        rating: { type: 'number' },
        ratingCount: { type: 'integer' },
        reviewCount: { type: 'integer' },
        relatedProductIds: { type: 'array', items: { type: 'string' } },
        categoryId: { type: 'string' },
        sellerId: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const CreateProductResponse = {
    status: 201,
    description: PRODUCT_CREATED_SUCCESS,
    ...successResponseSchema(productDataSchema, PRODUCT_CREATED_SUCCESS),
};

const productListDataSchema = {
    type: 'object',
    properties: {
        products: { type: 'array', items: productDataSchema },
        cursor: { type: 'string', nullable: true },
        hasMore: { type: 'boolean' },
        total: { type: 'number' },
    },
};

export const ProductListResponse = {
    status: 200,
    description: PRODUCT_LIST_SUCCESS,
    ...successResponseSchema(productListDataSchema, PRODUCT_LIST_SUCCESS),
};

export const ProductBySlugResponse = {
    status: 200,
    description: PRODUCT_FETCHED_SUCCESS,
    ...successResponseSchema(productDataSchema, PRODUCT_FETCHED_SUCCESS),
};

export const UpdateProductBody = {
    schema: {
        type: 'object',
        required: [],
        properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'integer' },
            categoryId: { type: 'string' },
            brand: { type: 'string' },
            tags: { type: 'string', description: 'Comma-separated tags' },
            compareAtPrice: { type: 'number' },
            weight: { type: 'number' },
            dimensions: { type: 'string' },
            warrantyInfo: { type: 'string' },
            expiryDate: { type: 'string' },
            images: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                nullable: true,
            },
        },
    },
};

export const UpdateProductResponse = {
    status: 200,
    description: PRODUCT_UPDATED_SUCCESS,
    ...successResponseSchema(productDataSchema, PRODUCT_UPDATED_SUCCESS),
};

export const DeleteProductResponse = {
    status: 200,
    description: PRODUCT_DELETED_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, PRODUCT_DELETED_SUCCESS),
};

export const SellerProductsResponse = {
    status: 200,
    description: SELLER_PRODUCTS_SUCCESS,
    ...successResponseSchema({ type: 'array', items: productDataSchema }, SELLER_PRODUCTS_SUCCESS),
};

export const AdminProductsResponse = {
    status: 200,
    description: ADMIN_PRODUCTS_SUCCESS,
    ...successResponseSchema({ type: 'array', items: productDataSchema }, ADMIN_PRODUCTS_SUCCESS),
};

export const AddImagesBody = {
    schema: {
        type: 'object',
        required: ['images'],
        properties: {
            images: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                description: 'Product images to upload',
            },
        },
    },
};

export const AddImagesResponse = {
    status: 200,
    description: 'Images added to product successfully',
    ...successResponseSchema(productDataSchema, 'Images added to product successfully'),
};

export const RemoveImageResponse = {
    status: 200,
    description: 'Image removed from product successfully',
    ...successResponseSchema(productDataSchema, 'Image removed from product successfully'),
};

const relatedListDataSchema = {
    type: 'object',
    properties: {
        products: { type: 'array', items: productDataSchema },
    },
};

export const RelatedProductsResponse = {
    status: 200,
    description: PRODUCT_RELATED_SUCCESS,
    ...successResponseSchema(relatedListDataSchema, PRODUCT_RELATED_SUCCESS),
};

export const SetRelatedBody = {
    schema: {
        type: 'object',
        required: ['relatedProductIds'],
        properties: {
            relatedProductIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of product IDs to set as related',
                example: ['id1', 'id2', 'id3'],
            },
        },
    },
};

export const SetRelatedResponse = {
    status: 200,
    description: PRODUCT_RELATED_SET_SUCCESS,
    ...successResponseSchema(productDataSchema, PRODUCT_RELATED_SET_SUCCESS),
};

export const RemoveRelatedResponse = {
    status: 200,
    description: PRODUCT_RELATED_REMOVED_SUCCESS,
    ...successResponseSchema(productDataSchema, PRODUCT_RELATED_REMOVED_SUCCESS),
};
