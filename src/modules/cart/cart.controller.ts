import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/types/index.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, RemoveCartItemsDto, UpdateCartItemDto } from './dto/index.js';
import {
    ApiRoutes,
    ApiTags as ApiTagsEnum,
    ApiOperation as ApiOperationEnum,
    AddCartItemResponse,
    GetCartResponse,
    RemoveCartItemResponse,
    UpdateCartItemResponse,
    CurrentUser,
    CART_ITEM_ADDED_SUCCESS,
    CART_RETRIEVED_SUCCESS,
    CART_ITEM_REMOVED_SUCCESS,
    CART_ITEM_UPDATED_SUCCESS,
    CART_INSUFFICIENT_STOCK,
    Roles,
    addCartItemBodySchema,
    removeCartItemsBodySchema,
    updateCartItemBodySchema,
} from '@/common/index.js';

@ApiTags(ApiTagsEnum.CART)
@Controller(ApiRoutes.CART)
export class CartController {

    constructor(private readonly cartService: CartService) { }

    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @Post(ApiRoutes.CART_ITEMS)
    @HttpCode(201)
    @ApiBody(addCartItemBodySchema)
    @ApiOperation({ summary: ApiOperationEnum.CART_ADD_ITEM })
    @ApiResponse(AddCartItemResponse)
    @ApiResponse({ status: 400, description: CART_INSUFFICIENT_STOCK })
    async addItemToCart(@CurrentUser('id') userId: string, @Body() dto: AddCartItemDto) {
        const data = await this.cartService.addItemToCart(userId, dto);
        return { message: CART_ITEM_ADDED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @Get(ApiRoutes.CART)
    @ApiOperation({ summary: ApiOperationEnum.CART_GET })
    @ApiResponse(GetCartResponse)
    async getCart(@CurrentUser('id') userId: string) {
        const data = await this.cartService.getCart(userId);
        return { message: CART_RETRIEVED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @Delete(ApiRoutes.CART_ITEMS)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CART_REMOVE_ITEM })
    @ApiBody(removeCartItemsBodySchema)
    @ApiResponse(RemoveCartItemResponse)
    async removeItemsFromCart(@CurrentUser('id') userId: string, @Body() dto: RemoveCartItemsDto) {
        const data = await this.cartService.removeItemsFromCart(userId, dto);
        return { message: CART_ITEM_REMOVED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @Patch(ApiRoutes.CART_ITEM_BY_PRODUCT)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CART_UPDATE_ITEM })
    @ApiBody(updateCartItemBodySchema)
    @ApiResponse(UpdateCartItemResponse)
    async updateCartItem(
        @CurrentUser('id') userId: string,
        @Param('productId') productId: string,
        @Body() dto: UpdateCartItemDto,
    ) {
        const data = await this.cartService.updateCartItem(userId, productId, dto.quantity);
        return { message: CART_ITEM_UPDATED_SUCCESS, data };
    }

}
