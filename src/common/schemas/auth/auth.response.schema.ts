import { successResponseSchema } from "@/common/constants/index.js";

export const registerUserSuccessMessage = 'User registered successfully';
export const loginUserSuccessMessage = 'User logged in successfully';
export const loggedInUserSuccessMessage = 'User fetched successfully';
export const refreshSuccessMessage = 'Token refreshed successfully';
export const logoutSuccessMessage = 'Logged out successfully';

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
    description: registerUserSuccessMessage,
    ...successResponseSchema(userDataSchema, registerUserSuccessMessage),
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
    description: loginUserSuccessMessage,
    ...successResponseSchema(loginDataSchema, loginUserSuccessMessage),
};

export const MeUserResponse = {
    status: 200,
    description: loggedInUserSuccessMessage,
    ...successResponseSchema(userDataSchema, loggedInUserSuccessMessage),
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
    description: refreshSuccessMessage,
    ...successResponseSchema(refreshDataSchema, refreshSuccessMessage),
};

export const LogoutUserResponse = {
    status: 200,
    description: logoutSuccessMessage,
    ...successResponseSchema({ type: 'object', properties: {} }, logoutSuccessMessage),
};
