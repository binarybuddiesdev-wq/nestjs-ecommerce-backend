import {
    successResponseSchema,
    CATEGORY_CREATED_SUCCESS as CONST_CATEGORY_CREATED_SUCCESS,
    CATEGORY_TREE_SUCCESS as CONST_CATEGORY_TREE_SUCCESS,
    CATEGORY_FETCHED_SUCCESS as CONST_CATEGORY_FETCHED_SUCCESS,
    CATEGORY_UPDATED_SUCCESS as CONST_CATEGORY_UPDATED_SUCCESS,
    CATEGORY_DELETED_SUCCESS as CONST_CATEGORY_DELETED_SUCCESS,
} from "@/common/constants/api.constants.js";

const CATEGORY_CREATED_SUCCESS = CONST_CATEGORY_CREATED_SUCCESS;
const CATEGORY_TREE_SUCCESS = CONST_CATEGORY_TREE_SUCCESS;
const CATEGORY_FETCHED_SUCCESS = CONST_CATEGORY_FETCHED_SUCCESS;
const CATEGORY_UPDATED_SUCCESS = CONST_CATEGORY_UPDATED_SUCCESS;
const CATEGORY_DELETED_SUCCESS = CONST_CATEGORY_DELETED_SUCCESS;

export const categoryDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        parentId: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const categoryTreeItemSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        parentId: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        children: {
            type: 'array',
            items: categoryDataSchema,
        },
    },
};

export const CreateCategoryResponse = {
    status: 201,
    description: CATEGORY_CREATED_SUCCESS,
    ...successResponseSchema(categoryDataSchema, CATEGORY_CREATED_SUCCESS),
};

export const CategoryTreeResponse = {
    status: 200,
    description: CATEGORY_TREE_SUCCESS,
    ...successResponseSchema({ type: 'array', items: categoryTreeItemSchema }, CATEGORY_TREE_SUCCESS),
};

export const CategoryBySlugResponse = {
    status: 200,
    description: CATEGORY_FETCHED_SUCCESS,
    ...successResponseSchema(categoryDataSchema, CATEGORY_FETCHED_SUCCESS),
};

export const UpdateCategoryResponse = {
    status: 200,
    description: CATEGORY_UPDATED_SUCCESS,
    ...successResponseSchema(categoryDataSchema, CATEGORY_UPDATED_SUCCESS),
};

export const DeleteCategoryResponse = {
    status: 200,
    description: CATEGORY_DELETED_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, CATEGORY_DELETED_SUCCESS),
};
