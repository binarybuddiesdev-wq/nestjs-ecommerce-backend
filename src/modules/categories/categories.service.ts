import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';
import { generateSlug } from '@/common/helpers/index.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { CATEGORY_NOT_FOUND, CATEGORY_SLUG_EXISTS, PARENT_CATEGORY_NOT_FOUND } from '@/common/index.js';

@Injectable()
export class CategoriesService {

    constructor(private readonly prisma: PrismaService, private readonly logger: PinoLogger) { }

    async createCategory(dto: CreateCategoryDto) {

        const slug = generateSlug(dto.name);
        const existingCategory = await this.prisma.category.findUnique({ where: { slug: slug } });
        if (existingCategory) {
            throw new ConflictException(CATEGORY_SLUG_EXISTS);
        }

        if (dto.parentId) {
            const parentCategory = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
            if (!parentCategory) {
                throw new NotFoundException(PARENT_CATEGORY_NOT_FOUND);
            }
        }

        const category = await this.prisma.category.create({
            data: { name: dto.name, slug, parentId: dto.parentId }
        });

        this.logger.info({ category }, 'Category created successfully');

        return category;
    }

    async findCategoryTree() {
        const allCategories = await this.prisma.category.findMany();

        const map = new Map<string, { children: unknown[] } & typeof allCategories[number]>();
        const roots: unknown[] = [];

        allCategories.forEach(cat => {
            map.set(cat.id, { ...cat, children: [] });
        });

        allCategories.forEach(cat => {
            const node = map.get(cat.id)!;
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }

    async findCategoryBySlug(slug: string) {

        if (!slug) {
            throw new BadRequestException('slug is required');
        }

        const category = await this.prisma.category.findUnique({ where: { slug } });
        if (!category) {
            throw new NotFoundException(CATEGORY_NOT_FOUND);
        }

        return category;

    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {

        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException(CATEGORY_NOT_FOUND);
        }

        if (dto.slug) {
            const existingCategory = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
            if (existingCategory && existingCategory.id !== id) {
                throw new ConflictException(CATEGORY_SLUG_EXISTS);
            }
        }

        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: dto,
        });

        this.logger.info({ updatedCategory }, 'Category updated successfully');

        return updatedCategory;
    }

    async deleteCategory(id: string) {

        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException(CATEGORY_NOT_FOUND);
        }

        await this.prisma.category.updateMany({
            where: { parentId: id },
            data: { parentId: null },
        });

        const deletedCategory = await this.prisma.category.update({
            where: { id },
            data: { isActive: false },
        });

        this.logger.info({ categoryId: id }, 'Category soft deleted');

        return deletedCategory;
    }

}
