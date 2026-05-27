import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import {
    ADD_ADDRESS_SUCCESS, AddAddressResponse,
    ApiOperation as ApiOperationEnum, ApiRoutes, ApiTags as ApiTagsEnum, AVATAR_UPLOAD_SUCCESS, AvatarUploadResponse, BECOME_SELLER_SUCCESS, BecomeSellerResponse, CurrentUser,
    DELETE_ADDRESS_SUCCESS,
    DELETE_ME_SUCCESS, DeleteAddressResponse, DeleteUserResponse, GET_ME_SUCCESS,
    LIST_ADDRESSES_SUCCESS,
    ListAddressResponse,
    UPDATE_ADDRESS_SUCCESS,
    UPDATE_ME_SUCCESS, UpdateAddressResponse, UpdateUserResponse, UserMeResponse,
    NO_FILE_UPLOADED
} from '@/common/index.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/index.js';

@ApiTags(ApiTagsEnum.USERS)
@Controller('users')
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    @ApiBearerAuth()
    @Get(ApiRoutes.ME)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_GET_ME })
    @ApiResponse(UserMeResponse)
    async me(@CurrentUser('id') userId: string) {
        const data = await this.usersService.getMe(userId);
        return { message: GET_ME_SUCCESS, data };
    }

    @ApiBearerAuth()
    @Patch(ApiRoutes.ME)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_UPDATE_ME })
    @ApiResponse(UpdateUserResponse)
    async updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
        const data = await this.usersService.updateMe(userId, dto);
        return { message: UPDATE_ME_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Delete(ApiRoutes.ME)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_DELETE_ME })
    @ApiResponse(DeleteUserResponse)
    async deleteMe(@CurrentUser('id') userId: string) {
        await this.usersService.deleteMe(userId);
        return { message: DELETE_ME_SUCCESS, data: {} }
    }

    @ApiBearerAuth()
    @Post(ApiRoutes.BECOME_SELLER)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_BECOME_SELLER })
    @ApiResponse(BecomeSellerResponse)
    async becomeSeller(@CurrentUser('id') userId: string) {
        const data = await this.usersService.becomeSeller(userId);
        return { message: BECOME_SELLER_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Post(ApiRoutes.ADDRESS)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_ADD_ADDRESS })
    @ApiResponse(AddAddressResponse)
    async addAddress(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
        const data = await this.usersService.addAddress(userId, dto);
        return { message: ADD_ADDRESS_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Get(ApiRoutes.ADDRESS)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_LIST_ADDRESSES })
    @ApiResponse(ListAddressResponse)
    async listAddress(@CurrentUser('id') userId: string) {
        const data = await this.usersService.listAddress(userId);
        return { message: LIST_ADDRESSES_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Patch(ApiRoutes.ADDRESS_BY_ID)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_UPDATE_ADDRESS })
    @ApiResponse(UpdateAddressResponse)
    async updateAddress(@CurrentUser('id') userId: string, @Param('id') addressId: string, @Body() dto: UpdateAddressDto) {
        const data = await this.usersService.updateAddress(userId, addressId, dto);
        return { message: UPDATE_ADDRESS_SUCCESS, data };
    }

    @ApiBearerAuth()
    @Delete(ApiRoutes.ADDRESS_BY_ID)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.USERS_DELETE_ADDRESS })
    @ApiResponse(DeleteAddressResponse)
    async deleteAddress(@CurrentUser('id') userId: string, @Param('id') addressId: string) {
        const data = await this.usersService.deleteAddress(userId, addressId);
        return { message: DELETE_ADDRESS_SUCCESS, data };
    }

    @ApiBearerAuth()
    @Post(ApiRoutes.UPLOAD_AVATAR)
    @HttpCode(200)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiOperation({ summary: ApiOperationEnum.USERS_UPLOAD_AVATAR })
    @ApiResponse(AvatarUploadResponse)
    async uploadAvatar(@CurrentUser('id') userId: string, @Req() req: FastifyRequest) {
        const fileData = await req.file();
        if (!fileData) {
            throw new BadRequestException(NO_FILE_UPLOADED);
        }
        const tempDir = join(process.cwd(), 'temp');
        await mkdir(tempDir, { recursive: true });
        const tempPath = join(tempDir, `${crypto.randomUUID()}-${fileData.filename}`);
        await pipeline(fileData.file, createWriteStream(tempPath));
        const data = await this.usersService.uploadAvatar(userId, tempPath);
        await unlink(tempPath);
        return { message: AVATAR_UPLOAD_SUCCESS, data };
    }

}
