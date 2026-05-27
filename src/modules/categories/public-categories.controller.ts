import { Controller, Get, HttpCode, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from './categories.service.js';
import {
    ApiOperation as ApiOperationEnum,
    ApiRoutes,
    ApiTags as ApiTagsEnum,
    CATEGORY_FETCHED_SUCCESS,
    CATEGORY_TREE_SUCCESS,
    CategoryBySlugResponse,
    CategoryTreeResponse,
    Public,
} from '@/common/index.js';

@ApiTags(ApiTagsEnum.CATEGORIES)
@Controller(ApiRoutes.CATEGORIES)
export class PublicCategoriesController {

    constructor(private readonly categoriesService: CategoriesService) { }

    @Public()
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CATEGORY_GET_TREE })
    @ApiResponse(CategoryTreeResponse)
    async findCategoryTree() {
        const data = await this.categoriesService.findCategoryTree();
        return { message: CATEGORY_TREE_SUCCESS, data };
    }

    @Public()
    @Get(':slug')
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.CATEGORY_GET_BY_SLUG })
    @ApiResponse(CategoryBySlugResponse)
    async findCategoryBySlug(@Param('slug') slug: string) {
        const data = await this.categoriesService.findCategoryBySlug(slug);
        return { message: CATEGORY_FETCHED_SUCCESS, data };
    }

}
