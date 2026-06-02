import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PinoLogger } from 'nestjs-pino';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ProductsService } from './products.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UserRole } from '@/types/index.js';

// Mock fs/promises unlink
vi.mock('node:fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let cacheManager: any;
  let uploadsService: UploadsService;

  const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    stores: [
      {
        iterator: vi.fn().mockImplementation(() => {
          return {
            async *[Symbol.asyncIterator]() {
              yield ['cache:products:list:query'];
            }
          };
        }),
      }
    ]
  };

  const mockPrismaService = {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  };

  const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockUploadsService = {
    uploadImages: vi.fn(),
  };

  const NOW = new Date();
  const mockProduct = {
    id: 'prod-1',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'Apple phone',
    price: 999,
    stock: 10,
    soldCount: 0,
    images: ['image1.jpg'],
    tags: ['apple', 'phone'],
    brand: 'Apple',
    compareAtPrice: 1099,
    weight: 0.2,
    dimensions: '15x7x0.8 cm',
    warrantyInfo: '1 year',
    expiryDate: null,
    rating: 0,
    ratingCount: 0,
    reviewCount: 0,
    relatedProductIds: ['prod-2'],
    categoryId: 'cat-1',
    sellerId: 'seller-1',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    parentId: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    uploadsService = module.get<UploadsService>(UploadsService);

    // Default mock behavior for transaction
    vi.mocked(prisma.$transaction).mockImplementation((promises: any) => Promise.all(promises));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createProduct ────────────────────────────────────────────────────────
  describe('createProduct', () => {
    it('creates a product successfully and invalidates cache', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct);

      const result = await service.createProduct('seller-1', {
        name: 'iPhone 15 Pro',
        description: 'Apple phone',
        price: 999,
        stock: 10,
        categoryId: 'cat-1',
      });

      expect(prisma.product.create).toHaveBeenCalled();
      expect(result.slug).toBe('iphone-15-pro');
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('uploads files when filePaths are provided', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);
      vi.mocked(uploadsService.uploadImages).mockResolvedValue(['uploaded.jpg']);
      vi.mocked(prisma.product.create).mockResolvedValue({
        ...mockProduct,
        images: ['uploaded.jpg'],
      });

      const result = await service.createProduct('seller-1', {
        name: 'iPhone 15 Pro',
        description: 'Apple phone',
        price: 999,
        stock: 10,
        categoryId: 'cat-1',
        filePaths: ['temp/image.jpg'],
      });

      expect(uploadsService.uploadImages).toHaveBeenCalledWith(['temp/image.jpg']);
      expect(result.images).toEqual(['uploaded.jpg']);
    });

    it('throws ConflictException if slug already exists', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      await expect(
        service.createProduct('seller-1', {
          name: 'iPhone 15 Pro',
          description: 'Apple phone',
          price: 999,
          stock: 10,
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if category does not exist', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(
        service.createProduct('seller-1', {
          name: 'iPhone 15 Pro',
          description: 'Apple phone',
          price: 999,
          stock: 10,
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if category is inactive', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      await expect(
        service.createProduct('seller-1', {
          name: 'iPhone 15 Pro',
          description: 'Apple phone',
          price: 999,
          stock: 10,
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('returns cached list if present', async () => {
      const mockResult = { products: [mockProduct], cursor: null, hasMore: false, total: 1 };
      vi.mocked(mockCacheManager.get).mockResolvedValue(mockResult);

      const result = await service.findAll({});

      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('fetches from DB and sets cache if not cached', async () => {
      vi.mocked(mockCacheManager.get).mockResolvedValue(null);
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct]);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await service.findAll({ search: 'phone' });

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(result.products).toHaveLength(1);
    });
  });

  // ─── updateProduct ────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('updates product successfully for seller-owner', async () => {
      // Cast implementation as any because Prisma's internal ProductClient return types are complex and not easily matched by standard mock promises
      vi.mocked(prisma.product.findUnique).mockImplementation((async (args: any) => {
        if (args?.where?.id === 'prod-1') return mockProduct;
        return null;
      }) as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        name: 'iPhone 15 Pro Max',
      });

      const result = await service.updateProduct('prod-1', 'seller-1', UserRole.SELLER, {
        name: 'iPhone 15 Pro Max',
      });

      expect(prisma.product.update).toHaveBeenCalled();
      expect(result.name).toBe('iPhone 15 Pro Max');
    });

    it('updates product successfully for admin (even if not owner)', async () => {
      // Cast implementation as any because Prisma's internal ProductClient return types are complex and not easily matched by standard mock promises
      vi.mocked(prisma.product.findUnique).mockImplementation((async (args: any) => {
        if (args?.where?.id === 'prod-1') return mockProduct;
        return null;
      }) as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        name: 'iPhone 15 Pro Max',
      });

      const result = await service.updateProduct('prod-1', 'admin-id', UserRole.ADMIN, {
        name: 'iPhone 15 Pro Max',
      });

      expect(result.name).toBe('iPhone 15 Pro Max');
    });

    it('throws ForbiddenException if non-owner seller tries to update', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      await expect(
        service.updateProduct('prod-1', 'other-seller', UserRole.SELLER, {
          name: 'iPhone 15 Pro Max',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if product does not exist', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        service.updateProduct('prod-1', 'seller-1', UserRole.SELLER, {
          name: 'iPhone 15 Pro Max',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('returns product if active', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      const result = await service.findBySlug('iphone-15-pro');

      expect(result).toEqual(mockProduct);
    });

    it('throws NotFoundException if product is inactive', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      await expect(service.findBySlug('iphone-15-pro')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteProduct ────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('soft deletes active product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      const result = await service.deleteProduct('prod-1', 'seller-1', UserRole.SELLER);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('returns early if product is already inactive', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      const result = await service.deleteProduct('prod-1', 'seller-1', UserRole.SELLER);

      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });

  // ─── addImages ────────────────────────────────────────────────────────────
  describe('addImages', () => {
    it('appends images successfully', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
      vi.mocked(uploadsService.uploadImages).mockResolvedValue(['image2.jpg']);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        images: ['image1.jpg', 'image2.jpg'],
      });

      const result = await service.addImages('prod-1', 'seller-1', UserRole.SELLER, ['temp/image2.jpg']);

      expect(uploadsService.uploadImages).toHaveBeenCalledWith(['temp/image2.jpg']);
      expect(result.images).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  // ─── removeImage ──────────────────────────────────────────────────────────
  describe('removeImage', () => {
    it('removes image at index successfully', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        images: ['image1.jpg', 'image2.jpg'],
      });
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        images: ['image2.jpg'],
      });

      const result = await service.removeImage('prod-1', 'seller-1', UserRole.SELLER, 0);

      expect(result.images).toEqual(['image2.jpg']);
    });

    it('throws BadRequestException for invalid image index', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      await expect(
        service.removeImage('prod-1', 'seller-1', UserRole.SELLER, 99),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findRelatedProducts ──────────────────────────────────────────────────
  describe('findRelatedProducts', () => {
    it('returns list of related products', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-2', name: 'Related Phone' } as any,
      ]);

      const result = await service.findRelatedProducts('prod-1');

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(result.products).toHaveLength(1);
    });
  });

  // ─── setRelatedProducts ───────────────────────────────────────────────────
  describe('setRelatedProducts', () => {
    it('sets related products successfully', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
      vi.mocked(prisma.product.findMany).mockResolvedValue([{ id: 'prod-2' } as any]);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        relatedProductIds: ['prod-2'],
      });

      const result = await service.setRelatedProducts('prod-1', 'seller-1', UserRole.SELLER, {
        relatedProductIds: ['prod-2'],
      });

      expect(result.relatedProductIds).toEqual(['prod-2']);
    });

    it('throws NotFoundException if related product does not exist', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await expect(
        service.setRelatedProducts('prod-1', 'seller-1', UserRole.SELLER, {
          relatedProductIds: ['prod-99'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── removeRelatedProduct ─────────────────────────────────────────────────
  describe('removeRelatedProduct', () => {
    it('removes related product successfully', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        relatedProductIds: ['prod-2', 'prod-3'],
      });
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        relatedProductIds: ['prod-3'],
      });

      const result = await service.removeRelatedProduct('prod-1', 'seller-1', UserRole.SELLER, 'prod-2');

      expect(result.relatedProductIds).toEqual(['prod-3']);
    });

    it('throws NotFoundException if relatedId is not associated', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      await expect(
        service.removeRelatedProduct('prod-1', 'seller-1', UserRole.SELLER, 'prod-99'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});