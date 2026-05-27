import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { CategoriesController } from './categories.controller.js';
import { PublicCategoriesController } from './public-categories.controller.js';
import { CategoriesService } from './categories.service.js';

const NOW = new Date();

const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    parentId: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
};

const mockCategoriesService = {
    createCategory: vi.fn(),
    findCategoryTree: vi.fn(),
    findCategoryBySlug: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
};

describe('CategoriesController (admin)', () => {
    let controller: CategoriesController;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({ port: 0, nodeEnv: 'test', databaseUrl: '' })],
                }),
                LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
            ],
            controllers: [CategoriesController],
            providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
    });

    it('createCategory — delegates to service and wraps response', async () => {
        mockCategoriesService.createCategory.mockResolvedValue(mockCategory);

        const result = await controller.createCategory({ name: 'Electronics' });

        expect(mockCategoriesService.createCategory).toHaveBeenCalledWith({ name: 'Electronics' });
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockCategory);
    });

    it('updateCategory — delegates to service with id and dto', async () => {
        const updated = { ...mockCategory, name: 'Consumer Electronics' };
        mockCategoriesService.updateCategory.mockResolvedValue(updated);

        const result = await controller.updateCategory('cat-1', { name: 'Consumer Electronics' });

        expect(mockCategoriesService.updateCategory).toHaveBeenCalledWith('cat-1', { name: 'Consumer Electronics' });
        expect(result.data.name).toBe('Consumer Electronics');
    });

    it('deleteCategory — delegates to service with id and wraps response', async () => {
        const softDeleted = { ...mockCategory, isActive: false };
        mockCategoriesService.deleteCategory.mockResolvedValue(softDeleted);

        const result = await controller.deleteCategory('cat-1');

        expect(mockCategoriesService.deleteCategory).toHaveBeenCalledWith('cat-1');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
    });
});

describe('PublicCategoriesController', () => {
    let controller: PublicCategoriesController;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({ port: 0, nodeEnv: 'test', databaseUrl: '' })],
                }),
                LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
            ],
            controllers: [PublicCategoriesController],
            providers: [{ provide: CategoriesService, useValue: mockCategoriesService }],
        }).compile();

        controller = module.get<PublicCategoriesController>(PublicCategoriesController);
    });

    it('findCategoryTree — delegates to service and wraps response', async () => {
        const tree = [{ ...mockCategory, children: [] }];
        mockCategoriesService.findCategoryTree.mockResolvedValue(tree);

        const result = await controller.findCategoryTree();

        expect(mockCategoriesService.findCategoryTree).toHaveBeenCalled();
        expect(result).toHaveProperty('message');
        expect(result.data).toEqual(tree);
    });

    it('findCategoryBySlug — delegates to service with the slug parameter', async () => {
        mockCategoriesService.findCategoryBySlug.mockResolvedValue(mockCategory);

        const result = await controller.findCategoryBySlug('electronics');

        expect(mockCategoriesService.findCategoryBySlug).toHaveBeenCalledWith('electronics');
        expect(result.data).toEqual(mockCategory);
    });
});
