import {
    successResponseSchema,
    UPLOAD_SUCCESS as CONST_UPLOAD_SUCCESS,
} from '@/common/constants/api.constants.js';

const UPLOAD_SUCCESS = CONST_UPLOAD_SUCCESS;

export const uploadUrlsDataSchema = {
    type: 'array',
    items: { type: 'string' },
};

export const UploadImagesResponse = {
    status: 200,
    description: UPLOAD_SUCCESS,
    ...successResponseSchema(uploadUrlsDataSchema, UPLOAD_SUCCESS),
};
