import {
    successResponseSchema,
    GET_ME_SUCCESS as CONST_GET_ME_SUCCESS,
    UPDATE_ME_SUCCESS as CONST_UPDATE_ME_SUCCESS,
    DELETE_ME_SUCCESS as CONST_DELETE_ME_SUCCESS,
    BECOME_SELLER_SUCCESS as CONST_BECOME_SELLER_SUCCESS,
    ADD_ADDRESS_SUCCESS as CONST_ADD_ADDRESS_SUCCESS,
    LIST_ADDRESSES_SUCCESS as CONST_LIST_ADDRESSES_SUCCESS,
    UPDATE_ADDRESS_SUCCESS as CONST_UPDATE_ADDRESS_SUCCESS,
    DELETE_ADDRESS_SUCCESS as CONST_DELETE_ADDRESS_SUCCESS,
    LIST_ALL_USERS_SUCCESS as CONST_LIST_ALL_USERS_SUCCESS,
    UPDATE_USER_ROLE_SUCCESS as CONST_UPDATE_USER_ROLE_SUCCESS,
    DELETE_ADMIN_USER_SUCCESS as CONST_DELETE_ADMIN_USER_SUCCESS,
    AVATAR_UPLOAD_SUCCESS as CONST_AVATAR_UPLOAD_SUCCESS
} from "@/common/constants/api.constants.js";

const GET_ME_SUCCESS = CONST_GET_ME_SUCCESS;
const UPDATE_ME_SUCCESS = CONST_UPDATE_ME_SUCCESS;
const DELETE_ME_SUCCESS = CONST_DELETE_ME_SUCCESS;
const BECOME_SELLER_SUCCESS = CONST_BECOME_SELLER_SUCCESS;
const ADD_ADDRESS_SUCCESS = CONST_ADD_ADDRESS_SUCCESS;
const LIST_ADDRESSES_SUCCESS = CONST_LIST_ADDRESSES_SUCCESS;
const UPDATE_ADDRESS_SUCCESS = CONST_UPDATE_ADDRESS_SUCCESS;
const DELETE_ADDRESS_SUCCESS = CONST_DELETE_ADDRESS_SUCCESS;
const LIST_ALL_USERS_SUCCESS = CONST_LIST_ALL_USERS_SUCCESS;
const UPDATE_USER_ROLE_SUCCESS = CONST_UPDATE_USER_ROLE_SUCCESS;
const DELETE_ADMIN_USER_SUCCESS = CONST_DELETE_ADMIN_USER_SUCCESS;
const AVATAR_UPLOAD_SUCCESS = CONST_AVATAR_UPLOAD_SUCCESS;

export const userProfileDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        avatar: { type: 'string' },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const addressDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zipCode: { type: 'string' },
        country: { type: 'string' },
        isDefault: { type: 'boolean' }
    }
}

export const UserMeResponse = {
    status: 200,
    description: GET_ME_SUCCESS,
    ...successResponseSchema(userProfileDataSchema, GET_ME_SUCCESS),
}

export const UpdateUserResponse = {
    status: 200,
    description: UPDATE_ME_SUCCESS,
    ...successResponseSchema(userProfileDataSchema, UPDATE_ME_SUCCESS),
}

export const DeleteUserResponse = {
    status: 200,
    description: DELETE_ME_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, DELETE_ME_SUCCESS)
}

export const BecomeSellerResponse = {
    status: 200,
    description: BECOME_SELLER_SUCCESS,
    ...successResponseSchema(userProfileDataSchema, BECOME_SELLER_SUCCESS)
}

export const AddAddressResponse = {
    status: 200,
    description: ADD_ADDRESS_SUCCESS,
    ...successResponseSchema(addressDataSchema, ADD_ADDRESS_SUCCESS)
}

export const ListAddressResponse = {
    status: 200,
    description: LIST_ADDRESSES_SUCCESS,
    ...successResponseSchema({ type: 'array', items: addressDataSchema }, LIST_ADDRESSES_SUCCESS)
}

export const UpdateAddressResponse = {
    status: 200,
    description: UPDATE_ADDRESS_SUCCESS,
    ...successResponseSchema(addressDataSchema, UPDATE_ADDRESS_SUCCESS)
}

export const DeleteAddressResponse = {
    status: 200,
    description: DELETE_ADDRESS_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, DELETE_ADDRESS_SUCCESS)
}

export const ListAllUsersResponse = {
    status: 200,
    description: LIST_ALL_USERS_SUCCESS,
    ...successResponseSchema({ type: 'array', items: userProfileDataSchema }, LIST_ALL_USERS_SUCCESS)
}

export const UpdateUserRoleResponse = {
    status: 200,
    description: UPDATE_USER_ROLE_SUCCESS,
    ...successResponseSchema(userProfileDataSchema, UPDATE_USER_ROLE_SUCCESS)
}

export const DeleteAdminUserResponse = {
    status: 200,
    description: DELETE_ADMIN_USER_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, DELETE_ADMIN_USER_SUCCESS)
}

export const AvatarUploadResponse = {
    status: 200,
    description: AVATAR_UPLOAD_SUCCESS,
    ...successResponseSchema(userProfileDataSchema, AVATAR_UPLOAD_SUCCESS),
}