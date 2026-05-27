import {
    successResponseSchema,
    REGISTER_SUCCESS,
    LOGIN_SUCCESS,
    ME_SUCCESS,
    REFRESH_SUCCESS,
    LOGOUT_SUCCESS
} from "@/common/constants/index.js";

export const userDataSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

export const RegisterUserResponse = {
    status: 201,
    description: REGISTER_SUCCESS,
    ...successResponseSchema(userDataSchema, REGISTER_SUCCESS),
};

export const loginDataSchema = {
    type: 'object',
    properties: {
        user: userDataSchema,
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
    },
};

export const LoginUserResponse = {
    status: 200,
    description: LOGIN_SUCCESS,
    ...successResponseSchema(loginDataSchema, LOGIN_SUCCESS),
};

export const MeUserResponse = {
    status: 200,
    description: ME_SUCCESS,
    ...successResponseSchema(userDataSchema, ME_SUCCESS),
};

export const refreshDataSchema = {
    type: 'object',
    properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
    },
};

export const RefreshUserResponse = {
    status: 200,
    description: REFRESH_SUCCESS,
    ...successResponseSchema(refreshDataSchema, REFRESH_SUCCESS),
};

export const LogoutUserResponse = {
    status: 200,
    description: LOGOUT_SUCCESS,
    ...successResponseSchema({ type: 'object', properties: {} }, LOGOUT_SUCCESS),
};
