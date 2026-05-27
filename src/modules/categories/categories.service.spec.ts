import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { CategoriesService } from './categories.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import {
    CATEGORY_NOT_FOUND,
    CATEGORY_SLUG_EXISTS,
    PARENT_CATEGORY_NOT_FOUND,
} from '@/common/index.js';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let prisma: PrismaService;
    let logger: PinoLogger;

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

    const mockSubCategory = {
        id: 'cat-2',
        name: 'Phones',
        slug: 'phones',
        parentId: 'cat-1',
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
    };

    beforeEach(() => {
        logger = {
            info: vi.fn(),
            debug: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        } as unknown as PinoLogger;

        prisma = {
            category: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
        } as unknown as PrismaService;

        service = new CategoriesService(prisma, logger);
    });

    // ─── createCategory ───────────────────────────────────────────────────────

    describe('createCategory', () => {
        it('creates a category and auto-generates slug from name', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(mockCategory);

            const result = await service.createCategory({ name: 'Electronics' });

            expect(prisma.category.findUnique).toHaveBeenCalledWith({
                where: { slug: 'electronics' },
            });
            expect(prisma.category.create).toHaveBeenCalledWith({
                data: { name: 'Electronics', slug: 'electronics', parentId: undefined },
            });
            expect(result.slug).toBe('electronics');
        });

        it('throws ConflictException when the generated slug already exists', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

            await expect(
                service.createCategory({ name: 'Electronics' }),
            ).rejects.toThrow(ConflictException);

            await expect(
                service.createCategory({ name: 'Electronics' }),
            ).rejects.toThrow(CATEGORY_SLUG_EXISTS);
        });

        it('creates a subcategory when a valid parentId is provided', async () => {
            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(null)        // slug check
                .mockResolvedValueOnce(mockCategory); // parent check

            vi.mocked(prisma.category.create).mockResolvedValue(mockSubCategory);

            const result = await service.createCategory({ name: 'Phones', parentId: 'cat-1' });

            expect(prisma.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
            expect(result.parentId).toBe('cat-1');
        });

        it('throws NotFoundException when parentId references a non-existent category', async () => {
            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(null)  // slug check — no conflict
                .mockResolvedValueOnce(null); // parent check — missing

            await expect(
                service.createCategory({ name: 'Phones', parentId: 'non-existent' }),
            ).rejects.toThrow(NotFoundException);

            await expect(
                service.createCategory({ name: 'Phones', parentId: 'non-existent' }),
            ).rejects.toThrow(PARENT_CATEGORY_NOT_FOUND);
        });
    });

    // ─── findCategoryTree ─────────────────────────────────────────────────────

    describe('findCategoryTree', () => {
        it('returns a hierarchical tree with children nested under their parent', async () => {
            vi.mocked(prisma.category.findMany).mockResolvedValue([
                mockCategory,
                mockSubCategory,
            ]);

            const tree = await service.findCategoryTree() as Array<{
                id: string;
                children: Array<{ id: string }>;
            }>;

            expect(tree).toHaveLength(1);
            expect(tree[0].id).toBe('cat-1');
            expect(tree[0].children).toHaveLength(1);
            expect(tree[0].children[0].id).toBe('cat-2');
        });

        it('returns an empty array when no categories exist', async () => {
            vi.mocked(prisma.category.findMany).mockResolvedValue([]);

            const tree = await service.findCategoryTree();

            expect(tree).toEqual([]);
        });

        it('returns all root categories when none have a parent', async () => {
            vi.mocked(prisma.category.findMany).mockResolvedValue([
                mockCategory,
                { ...mockSubCategory, parentId: null, id: 'cat-3', slug: 'clothing' },
            ]);

            const tree = await service.findCategoryTree() as unknown[];

            expect(tree).toHaveLength(2);
        });
    });

    // ─── findCategoryBySlug ───────────────────────────────────────────────────

    describe('findCategoryBySlug', () => {
        it('returns the category for a valid slug', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

            const result = await service.findCategoryBySlug('electronics');

            expect(prisma.category.findUnique).toHaveBeenCalledWith({
                where: { slug: 'electronics' },
            });
            expect(result.id).toBe('cat-1');
        });

        it('throws NotFoundException when no category matches the slug', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            await expect(service.findCategoryBySlug('unknown-slug')).rejects.toThrow(NotFoundException);
            await expect(service.findCategoryBySlug('unknown-slug')).rejects.toThrow(CATEGORY_NOT_FOUND);
        });

        it('throws BadRequestException when slug is an empty string', async () => {
            await expect(service.findCategoryBySlug('')).rejects.toThrow(BadRequestException);
        });
    });

    // ─── updateCategory ───────────────────────────────────────────────────────

    describe('updateCategory', () => {
        it('updates a category and returns the updated record', async () => {
            const updated = { ...mockCategory, name: 'Consumer Electronics' };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
            vi.mocked(prisma.category.update).mockResolvedValue(updated);

            const result = await service.updateCategory('cat-1', { name: 'Consumer Electronics' });

            expect(prisma.category.update).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
                data: { name: 'Consumer Electronics' },
            });
            expect(result.name).toBe('Consumer Electronics');
        });

        it('throws NotFoundException when updating a non-existent category', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            await expect(
                service.updateCategory('non-existent', { name: 'X' }),
            ).rejects.toThrow(NotFoundException);

            await expect(
                service.updateCategory('non-existent', { name: 'X' }),
            ).rejects.toThrow(CATEGORY_NOT_FOUND);
        });

        it('throws ConflictException when the new slug is already taken by another category', async () => {
            const anotherCategory = { ...mockCategory, id: 'cat-99', slug: 'phones' };

            // Two calls to updateCategory each consume 2 mocks: existence check then slug check.
            // Four total mocks handle both assertions without mock exhaustion.
            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(mockCategory)      // 1st call — existence check
                .mockResolvedValueOnce(anotherCategory)   // 1st call — slug conflict
                .mockResolvedValueOnce(mockCategory)      // 2nd call — existence check
                .mockResolvedValueOnce(anotherCategory);  // 2nd call — slug conflict

            await expect(
                service.updateCategory('cat-1', { slug: 'phones' }),
            ).rejects.toThrow(ConflictException);

            await expect(
                service.updateCategory('cat-1', { slug: 'phones' }),
            ).rejects.toThrow(CATEGORY_SLUG_EXISTS);
        });

        it('allows updating the slug to the same value owned by the category itself', async () => {
            const updated = { ...mockCategory };

            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(mockCategory)  // existence check
                .mockResolvedValueOnce(mockCategory); // slug lookup returns self — same id

            vi.mocked(prisma.category.update).mockResolvedValue(updated);

            const result = await service.updateCategory('cat-1', { slug: 'electronics' });

            expect(result.slug).toBe('electronics');
        });
    });

    // ─── deleteCategory ───────────────────────────────────────────────────────

    describe('deleteCategory', () => {
        it('soft-deletes a category by setting isActive to false', async () => {
            const softDeleted = { ...mockCategory, isActive: false };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
            vi.mocked(prisma.category.updateMany).mockResolvedValue({ count: 0 });
            vi.mocked(prisma.category.update).mockResolvedValue(softDeleted);

            const result = await service.deleteCategory('cat-1');

            expect(prisma.category.update).toHaveBeenCalledWith({
                where: { id: 'cat-1' },
                data: { isActive: false },
            });
            expect(result.isActive).toBe(false);
        });

        it('throws NotFoundException when deleting a non-existent category', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            await expect(service.deleteCategory('non-existent')).rejects.toThrow(NotFoundException);
            await expect(service.deleteCategory('non-existent')).rejects.toThrow(CATEGORY_NOT_FOUND);
        });

        it('unlinks children (sets parentId to null) before soft-deleting the parent', async () => {
            vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
            vi.mocked(prisma.category.updateMany).mockResolvedValue({ count: 2 });
            vi.mocked(prisma.category.update).mockResolvedValue({ ...mockCategory, isActive: false });

            await service.deleteCategory('cat-1');

            expect(prisma.category.updateMany).toHaveBeenCalledWith({
                where: { parentId: 'cat-1' },
                data: { parentId: null },
            });
        });
    });
});
