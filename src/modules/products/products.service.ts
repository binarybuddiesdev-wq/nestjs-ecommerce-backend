import { PinoLogger } from 'nestjs-pino';
import { unlink } from 'node:fs/promises';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { UserRole } from '@/types/index.js';
import { Prisma } from 'generated/prisma/client.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { generateSlug } from '@/common/helpers/index.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateProductDto, ProductQueryDto, SetRelatedProductsDto, UpdateProductDto } from './dto/index.js';
import {
    CACHE_KEYS, CACHE_TTL, CATEGORY_NOT_ACTIVE, CATEGORY_NOT_FOUND, INVALID_IMAGE_INDEX, PRODUCT_NOT_FOUND,
    PRODUCT_NOT_OWNER, PRODUCT_SLUG_EXISTS, RELATED_PRODUCT_NOT_FOUND
} from '@/common/index.js';

@Injectable()
export class ProductsService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLogger,
        private readonly uploadsService: UploadsService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async createProduct(userId: string, dto: CreateProductDto) {

        const slug = generateSlug(dto.name);
        const existingProduct = await this.prisma.product.findUnique({ where: { slug } });
        if (existingProduct) {
            throw new ConflictException(PRODUCT_SLUG_EXISTS);
        }

        const categoryExists = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (!categoryExists) {
            throw new NotFoundException(CATEGORY_NOT_FOUND)
        }
        if (!categoryExists.isActive) {
            throw new BadRequestException(CATEGORY_NOT_ACTIVE);
        }

        let images: string[] = [];
        if (dto.filePaths && dto.filePaths.length > 0) {
            images = await this.uploadsService.uploadImages(dto.filePaths);
            for (const filePath of dto.filePaths) {
                await unlink(filePath).catch(() => { });
            }
        }

        const product = await this.prisma.product.create({
            data: {
                name: dto.name,
                slug,
                description: dto.description,
                price: dto.price,
                stock: dto.stock,
                images,
                brand: dto.brand,
                tags: dto.tags ?? [],
                compareAtPrice: dto.compareAtPrice,
                weight: dto.weight,
                dimensions: dto.dimensions,
                warrantyInfo: dto.warrantyInfo,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                categoryId: dto.categoryId,
                sellerId: userId,
            }
        });

        this.logger.info({ product }, 'Product created successfully');

        await this.invalidateProductListCache();

        return product;

    }

    private async findProductsWithQuery(baseWhere: Prisma.ProductWhereInput, query: ProductQueryDto) {

        const { category, cursor, limit, maxPrice, minPrice, search, brand, inStock, sort, tag } = query;
        const where = { ...baseWhere };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = minPrice;
            if (maxPrice) where.price.lte = maxPrice;
        }

        if (inStock) {
            where.stock = { gt: 0 };
        }

        if (tag) {
            where.tags = { has: tag };
        }

        if (category) {
            const cat = await this.prisma.category.findUnique({ where: { slug: category } });
            if (cat) where.categoryId = cat.id;
        }

        const limitNum = limit ?? 20;

        const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
            switch (sort) {
                case 'price_asc': return { price: 'asc' };
                case 'price_desc': return { price: 'desc' };
                case 'name_asc': return { name: 'asc' };
                case 'name_desc': return { name: 'desc' };
                case 'createdAt_asc': return { createdAt: 'asc' };
                case 'createdAt_desc': return { createdAt: 'desc' };
                default: return { createdAt: 'desc' };
            }
        })();

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                take: limitNum + 1,
                ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
                orderBy,
            }),
            this.prisma.product.count({ where }),
        ]);

        const hasMore = products.length > limitNum;
        if (hasMore) products.pop();

        const nextCursor = hasMore ? products[products.length - 1].id : null;

        return { products, cursor: nextCursor, hasMore, total };

    }

    async findAll(query: ProductQueryDto) {
        const cacheKey = `${CACHE_KEYS.PRODUCTS_LIST}:${JSON.stringify(query)}`;

        try {
            const cached = await this.cacheManager.get<Awaited<ReturnType<typeof this.findProductsWithQuery>>>(cacheKey);
            if (cached) return cached;
        } catch {
            this.logger.warn('Redis read failed — falling through to DB');
        }

        const data = await this.findProductsWithQuery({ isActive: true }, query);

        try {
            await this.cacheManager.set(cacheKey, data, CACHE_TTL.PRODUCTS_LIST);
        } catch {
            this.logger.warn('Redis write failed');
        }

        return data;
    }

    private async invalidateProductListCache() {
        try {
            // Cast to any to bypass strict type signature of Keyv.iterator which expects a namespace parameter
            const store = this.cacheManager.stores?.[0] as any;
            if (store && typeof store.iterator === 'function') {
                for await (const [key] of store.iterator()) {
                    if (key.startsWith(CACHE_KEYS.PRODUCTS_LIST)) {
                        await this.cacheManager.del(key);
                    }
                }
            } else {
                await this.cacheManager.del(CACHE_KEYS.PRODUCTS_LIST);
            }
            this.logger.debug('Product list cache invalidated');
        } catch {
            this.logger.warn('Cache invalidation failed');
        }
    }

    async updateProduct(productId: string, userId: string, role: UserRole, dto: UpdateProductDto) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (role !== UserRole.ADMIN && userId !== product.sellerId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        let slug: string | undefined;
        if (dto.name && dto.name !== product.name) {
            slug = generateSlug(dto.name);
            const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
            if (existingSlug) {
                throw new ConflictException(PRODUCT_SLUG_EXISTS);
            }
        }

        if (dto.categoryId && dto.categoryId !== product.categoryId) {
            const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
            if (!category) {
                throw new NotFoundException(CATEGORY_NOT_FOUND);
            }
            if (!category.isActive) {
                throw new BadRequestException(CATEGORY_NOT_ACTIVE);
            }
        }

        let images: string[] = [];
        if (dto.filePaths && dto.filePaths.length > 0) {
            images = await this.uploadsService.uploadImages(dto.filePaths);
            for (const filePath of dto.filePaths) {
                await unlink(filePath).catch(() => { });
            }
        }

        const updateData: Prisma.ProductUpdateInput = {
            ...(dto.name !== undefined && dto.name !== product.name && { name: dto.name }),
            ...(slug !== undefined && { slug }),
            ...(dto.description !== undefined && dto.description !== product.description && { description: dto.description }),
            ...(dto.price !== undefined && dto.price !== product.price && { price: dto.price }),
            ...(dto.stock !== undefined && dto.stock !== product.stock && { stock: dto.stock }),
            ...(dto.brand !== undefined && dto.brand !== product.brand && { brand: dto.brand }),
            ...(dto.tags !== undefined && { tags: dto.tags }),
            ...(dto.compareAtPrice !== undefined && dto.compareAtPrice !== product.compareAtPrice && { compareAtPrice: dto.compareAtPrice }),
            ...(dto.weight !== undefined && dto.weight !== product.weight && { weight: dto.weight }),
            ...(dto.dimensions !== undefined && dto.dimensions !== product.dimensions && { dimensions: dto.dimensions }),
            ...(dto.warrantyInfo !== undefined && dto.warrantyInfo !== product.warrantyInfo && { warrantyInfo: dto.warrantyInfo }),
            ...(dto.expiryDate !== undefined && { expiryDate: new Date(dto.expiryDate) }),
            ...(dto.categoryId !== undefined && dto.categoryId !== product.categoryId && { categoryId: dto.categoryId }),
            ...(dto.filePaths !== undefined && dto.filePaths.length > 0 && { images }),
        };

        const updatedProduct = await this.prisma.product.update({ where: { id: productId }, data: updateData });

        this.logger.info({ product: updatedProduct }, 'Product updated successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({ where: { slug } });
        if (!product || !product.isActive) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }
        return product;
    }

    async deleteProduct(productId: string, userId: string, role: UserRole) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (role !== UserRole.ADMIN && product.sellerId !== userId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        if (!product.isActive) {
            return product;
        }

        const updatedProduct = await this.prisma.product.update({ where: { id: productId }, data: { isActive: false } });

        this.logger.info({ productId }, 'Product deleted successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }

    async findSellerProducts(userId: string, query: ProductQueryDto) {
        return this.findProductsWithQuery({ sellerId: userId }, query);
    }

    async findAdminProducts(query: ProductQueryDto) {
        return this.findProductsWithQuery({}, query);
    }

    async addImages(productId: string, userId: string, role: UserRole, filePaths: string[]) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (role !== UserRole.ADMIN && product.sellerId !== userId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        const newImages = await this.uploadsService.uploadImages(filePaths);
        for (const filePath of filePaths) {
            await unlink(filePath).catch(() => { });
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { images: [...product.images, ...newImages] },
        });

        this.logger.info({ productId, newCount: newImages.length }, 'Images added to product successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }

    async removeImage(productId: string, userId: string, role: UserRole, index: number) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (role !== UserRole.ADMIN && product.sellerId !== userId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        if (index < 0 || index >= product.images.length) {
            throw new BadRequestException(INVALID_IMAGE_INDEX);
        }

        const updatedImages = product.images.filter((_, i) => i !== index);

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { images: updatedImages },
        });

        this.logger.info({ productId, removedIndex: index }, 'Image removed from product successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }

    async findRelatedProducts(productId: string) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (product.relatedProductIds.length === 0) {
            return { products: [] }
        }

        const products = await this.prisma.product.findMany({
            where: {
                id: { in: product.relatedProductIds },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
            },
        });

        this.logger.info({ productId, relatedCount: products.length }, 'Related products found successfully');

        return { products };

    }

    async setRelatedProducts(productId: string, userId: string, role: UserRole, dto: SetRelatedProductsDto) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);

        }

        if (role !== UserRole.ADMIN && product.sellerId !== userId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        if (dto.relatedProductIds.length > 0) {
            const existing = await this.prisma.product.findMany({
                where: { id: { in: dto.relatedProductIds }, isActive: true },
                select: { id: true },
            });

            if (existing.length !== dto.relatedProductIds.length) {
                throw new NotFoundException(RELATED_PRODUCT_NOT_FOUND);
            }
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { relatedProductIds: dto.relatedProductIds },
        });

        this.logger.info({ productId, relatedCount: dto.relatedProductIds.length }, 'Related products updated successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }


    async removeRelatedProduct(productId: string, userId: string, role: UserRole, relatedId: string) {

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (role !== UserRole.ADMIN && product.sellerId !== userId) {
            throw new ForbiddenException(PRODUCT_NOT_OWNER);
        }

        if (!product.relatedProductIds.includes(relatedId)) {
            throw new NotFoundException(RELATED_PRODUCT_NOT_FOUND);
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: { relatedProductIds: product.relatedProductIds.filter((id) => id !== relatedId) },
        });

        this.logger.info({ productId, relatedId }, 'Related product removed successfully');

        await this.invalidateProductListCache();

        return updatedProduct;

    }

}
