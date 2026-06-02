import type { FastifyRequest } from 'fastify';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/types/index.js';
import { ProductsService } from './products.service.js';
import { parseMultipartForm } from '@/common/helpers/index.js';
import { ApiTags as ApiTagsEnum, ApiOperation as ApiOperationEnum, ProductListResponse, UpdateProductResponse, PRODUCT_UPDATED_SUCCESS, ProductBySlugResponse, PRODUCT_FETCHED_SUCCESS, DeleteProductResponse, PRODUCT_DELETED_SUCCESS, SellerProductsResponse, SELLER_PRODUCTS_SUCCESS, AdminProductsResponse, ADMIN_PRODUCTS_SUCCESS, PRODUCT_IMAGES_ADDED_SUCCESS, PRODUCT_IMAGE_REMOVED_SUCCESS, AddImagesBody, AddImagesResponse, RemoveImageResponse, RelatedProductsResponse, PRODUCT_RELATED_SUCCESS, SetRelatedResponse, SetRelatedBody, PRODUCT_RELATED_SET_SUCCESS, PRODUCT_RELATED_REMOVED_SUCCESS, RemoveRelatedResponse } from '@/common/index.js';
import { ApiRoutes, CreateProductBody, CreateProductResponse, CurrentUser, PRODUCT_CREATED_SUCCESS, PRODUCT_LIST_SUCCESS, Public, Roles, UpdateProductBody } from '@/common/index.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { SetRelatedProductsDto } from './dto/set-related-products.dto.js';

@ApiTags(ApiTagsEnum.PRODUCTS)
@Controller(ApiRoutes.PRODUCTS)
export class ProductsController {

    constructor(private readonly productsService: ProductsService) { }

    @ApiBearerAuth()
    @Roles(UserRole.ADMIN, UserRole.SELLER)
    @Post()
    @HttpCode(201)
    @ApiConsumes('multipart/form-data')
    @ApiBody(CreateProductBody)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_CREATE })
    @ApiResponse(CreateProductResponse)
    async createProduct(@CurrentUser('id') userId: string, @Req() req: FastifyRequest) {
        const { fields, filePaths } = await parseMultipartForm(req, ['name', 'description', 'price', 'stock', 'categoryId']);
        const data = await this.productsService.createProduct(userId, {
            name: fields.name,
            description: fields.description,
            price: Number(fields.price),
            stock: Number(fields.stock),
            categoryId: fields.categoryId,
            brand: fields.brand || undefined,
            tags: fields.tags ? fields.tags.split(',').map((t: string) => t.trim()) : undefined,
            compareAtPrice: fields.compareAtPrice ? Number(fields.compareAtPrice) : undefined,
            weight: fields.weight ? Number(fields.weight) : undefined,
            dimensions: fields.dimensions || undefined,
            warrantyInfo: fields.warrantyInfo || undefined,
            expiryDate: fields.expiryDate || undefined,
            filePaths,
        });
        return { message: PRODUCT_CREATED_SUCCESS, data };
    }


    @Public()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_LIST })
    @ApiResponse(ProductListResponse)
    async findAll(@Query() query: ProductQueryDto) {
        const data = await this.productsService.findAll(query);
        return { message: PRODUCT_LIST_SUCCESS, data };
    }

    @ApiBearerAuth()
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    @Patch(ApiRoutes.PRODUCT_BY_ID)
    @ApiConsumes('multipart/form-data')
    @ApiBody(UpdateProductBody)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_UPDATE })
    @ApiResponse(UpdateProductResponse)
    async updateProduct(
        @Param('id') productId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: UserRole,
        @Req() req: FastifyRequest,
    ) {
        const { fields, filePaths } = await parseMultipartForm(req, []);
        const dto: UpdateProductDto = {
            name: fields.name || undefined,
            description: fields.description || undefined,
            price: fields.price ? Number(fields.price) : undefined,
            stock: fields.stock ? Number(fields.stock) : undefined,
            categoryId: fields.categoryId || undefined,
            brand: fields.brand || undefined,
            tags: fields.tags ? fields.tags.split(',').map((t: string) => t.trim()) : undefined,
            compareAtPrice: fields.compareAtPrice ? Number(fields.compareAtPrice) : undefined,
            weight: fields.weight ? Number(fields.weight) : undefined,
            dimensions: fields.dimensions || undefined,
            warrantyInfo: fields.warrantyInfo || undefined,
            expiryDate: fields.expiryDate || undefined,
            filePaths,
        };
        const data = await this.productsService.updateProduct(productId, userId, role, dto);
        return { message: PRODUCT_UPDATED_SUCCESS, data };
    }


    @Public()
    @Get(ApiRoutes.PRODUCT_BY_SLUG)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_GET_BY_SLUG })
    @ApiResponse(ProductBySlugResponse)
    async findBySlug(@Param('slug') slug: string) {
        const data = await this.productsService.findBySlug(slug);
        return { message: PRODUCT_FETCHED_SUCCESS, data }
    }


    @ApiBearerAuth()
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    @Delete(ApiRoutes.PRODUCT_BY_ID)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_DELETE })
    @ApiResponse(DeleteProductResponse)
    async deleteProduct(@Param('id') productId: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
        const data = await this.productsService.deleteProduct(productId, userId, role);
        return { message: PRODUCT_DELETED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    @Get(ApiRoutes.SELLER_PRODUCTS)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.SELLER_LIST_PRODUCTS })
    @ApiResponse(SellerProductsResponse)
    async findSellerProducts(@CurrentUser('id') userId: string, @Query() query: ProductQueryDto) {
        const data = await this.productsService.findSellerProducts(userId, query);
        return { message: SELLER_PRODUCTS_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @Get(ApiRoutes.ADMIN_PRODUCTS)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.ADMIN_LIST_PRODUCTS })
    @ApiResponse(AdminProductsResponse)
    async findAdminProducts(@Query() query: ProductQueryDto) {
        const data = await this.productsService.findAdminProducts(query);
        return { message: ADMIN_PRODUCTS_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    @Post(ApiRoutes.PRODUCT_IMAGES)
    @ApiConsumes('multipart/form-data')
    @ApiBody(AddImagesBody)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_ADD_IMAGES })
    @ApiResponse(AddImagesResponse)
    async addImages(
        @Param('id') productId: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: UserRole,
        @Req() req: FastifyRequest,
    ) {
        const { filePaths } = await parseMultipartForm(req, []);
        const data = await this.productsService.addImages(productId, userId, role, filePaths);
        return { message: PRODUCT_IMAGES_ADDED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    @Delete(ApiRoutes.PRODUCT_IMAGE_BY_INDEX)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_REMOVE_IMAGE })
    @ApiResponse(RemoveImageResponse)
    async removeImage(
        @Param('id') productId: string,
        @Param('index') index: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: UserRole,
    ) {
        const data = await this.productsService.removeImage(productId, userId, role, Number(index));
        return { message: PRODUCT_IMAGE_REMOVED_SUCCESS, data };
    }


    @Public()
    @Get(ApiRoutes.PRODUCT_RELATED)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_GET_RELATED })
    @ApiResponse(RelatedProductsResponse)
    async findRelatedProducts(@Param('id') productId: string) {
        const data = await this.productsService.findRelatedProducts(productId);
        return { message: PRODUCT_RELATED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.ADMIN, UserRole.SELLER)
    @Post(ApiRoutes.PRODUCT_RELATED)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_SET_RELATED })
    @ApiBody(SetRelatedBody)
    @ApiResponse(SetRelatedResponse)
    async setRelatedProducts(@Param('id') productId: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole, @Body() dto: SetRelatedProductsDto) {
        const data = await this.productsService.setRelatedProducts(productId, userId, role, dto);
        return { message: PRODUCT_RELATED_SET_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Roles(UserRole.ADMIN, UserRole.SELLER)
    @Delete(ApiRoutes.PRODUCT_RELATED_BY_ID)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.PRODUCT_REMOVE_RELATED })
    @ApiResponse(RemoveRelatedResponse)
    async removeRelatedProduct(@Param('id') productId: string, @Param('relatedId') relatedId: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
        const data = await this.productsService.removeRelatedProduct(productId, userId, role, relatedId);
        return { message: PRODUCT_RELATED_REMOVED_SUCCESS, data };
    }

}
