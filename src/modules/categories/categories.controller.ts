import { Body, Controller, Delete, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserRole } from '@/types/index.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import {
    ApiOperation as ApiOperationEnum,
    ApiRoutes,
    ApiTags as ApiTagsEnum,
    CATEGORY_CREATED_SUCCESS,
    CATEGORY_DELETED_SUCCESS,
    CATEGORY_UPDATED_SUCCESS,
    CreateCategoryResponse,
    DeleteCategoryResponse,
    Roles,
    UpdateCategoryResponse,
} from '@/common/index.js';

@ApiTags(ApiTagsEnum.CATEGORIES)
@Controller(ApiRoutes.ADMIN_CATEGORIES)
export class CategoriesController {

    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @HttpCode(201)
    @ApiOperation({ summary: ApiOperationEnum.CATEGORY_CREATE })
    @ApiResponse(CreateCategoryResponse)
    async createCategory(@Body() dto: CreateCategoryDto) {
        const data = await this.categoriesService.createCategory(dto);
        return { message: CATEGORY_CREATED_SUCCESS, data };
    }


    @ApiBearerAuth()
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CATEGORY_UPDATE })
    @ApiResponse(UpdateCategoryResponse)
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        const data = await this.categoriesService.updateCategory(id, dto);
        return { message: CATEGORY_UPDATED_SUCCESS, data };
    }

    @Delete(':id')
    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CATEGORY_DELETE })
    @ApiResponse(DeleteCategoryResponse)
    async deleteCategory(@Param('id') id: string) {
        const data = await this.categoriesService.deleteCategory(id);
        return { message: CATEGORY_DELETED_SUCCESS, data };
    }

}
