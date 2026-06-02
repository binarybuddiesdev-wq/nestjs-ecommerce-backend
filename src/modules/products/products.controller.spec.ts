import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { FastifyRequest } from 'fastify';

import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { UserRole } from '@/types/index.js';
import { parseMultipartForm } from '@/common/helpers/index.js';

// Mock the helper functions
vi.mock('@/common/helpers/index.js', () => ({
  parseMultipartForm: vi.fn(),
  generateSlug: vi.fn((name: string) => name.toLowerCase().replace(/ /g, '-')),
}));

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    createProduct: vi.fn(),
    findAll: vi.fn(),
    updateProduct: vi.fn(),
    findBySlug: vi.fn(),
    deleteProduct: vi.fn(),
    findSellerProducts: vi.fn(),
    findAdminProducts: vi.fn(),
    addImages: vi.fn(),
    removeImage: vi.fn(),
    findRelatedProducts: vi.fn(),
    setRelatedProducts: vi.fn(),
    removeRelatedProduct: vi.fn(),
  };

  const mockRequest = {} as FastifyRequest;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── createProduct ────────────────────────────────────────────────────────
  describe('createProduct', () => {
    it('parses form-data and calls service.createProduct', async () => {
      const mockFields = {
        name: 'iPhone 15',
        description: 'Apple phone',
        price: '999',
        stock: '10',
        categoryId: 'cat-123',
        brand: 'Apple',
        tags: 'new,apple',
      };
      vi.mocked(parseMultipartForm).mockResolvedValue({
        fields: mockFields,
        filePaths: ['temp/img.jpg'],
      });
      vi.mocked(service.createProduct).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.createProduct('user-123', mockRequest);

      expect(parseMultipartForm).toHaveBeenCalledWith(mockRequest, ['name', 'description', 'price', 'stock', 'categoryId']);
      expect(service.createProduct).toHaveBeenCalledWith('user-123', {
        name: 'iPhone 15',
        description: 'Apple phone',
        price: 999,
        stock: 10,
        categoryId: 'cat-123',
        brand: 'Apple',
        tags: ['new', 'apple'],
        compareAtPrice: undefined,
        weight: undefined,
        dimensions: undefined,
        warrantyInfo: undefined,
        expiryDate: undefined,
        filePaths: ['temp/img.jpg'],
      });
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('calls service.findAll with query object', async () => {
      const query = { category: 'electronics', inStock: true };
      vi.mocked(service.findAll).mockResolvedValue({ products: [], cursor: null, hasMore: false, total: 0 });

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      // Cast to any since success is added at runtime by TransformInterceptor and not present on controller return type
      expect((result as any).success).toBeUndefined();
      expect(result.data.products).toEqual([]);
    });
  });

  // ─── updateProduct ────────────────────────────────────────────────────────
  describe('updateProduct', () => {
    it('parses form-data and calls service.updateProduct', async () => {
      const mockFields = {
        name: 'iPhone 15 Updated',
        price: '899',
      };
      vi.mocked(parseMultipartForm).mockResolvedValue({
        fields: mockFields,
        filePaths: [],
      });
      vi.mocked(service.updateProduct).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.updateProduct('prod-123', 'user-123', UserRole.SELLER, mockRequest);

      expect(parseMultipartForm).toHaveBeenCalledWith(mockRequest, []);
      expect(service.updateProduct).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER, {
        name: 'iPhone 15 Updated',
        description: undefined,
        price: 899,
        stock: undefined,
        categoryId: undefined,
        brand: undefined,
        tags: undefined,
        compareAtPrice: undefined,
        weight: undefined,
        dimensions: undefined,
        warrantyInfo: undefined,
        expiryDate: undefined,
        filePaths: [],
      });
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('calls service.findBySlug', async () => {
      vi.mocked(service.findBySlug).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.findBySlug('iphone-15');

      expect(service.findBySlug).toHaveBeenCalledWith('iphone-15');
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── deleteProduct ────────────────────────────────────────────────────────
  describe('deleteProduct', () => {
    it('calls service.deleteProduct', async () => {
      vi.mocked(service.deleteProduct).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.deleteProduct('prod-123', 'user-123', UserRole.SELLER);

      expect(service.deleteProduct).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER);
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── findSellerProducts ───────────────────────────────────────────────────
  describe('findSellerProducts', () => {
    it('calls service.findSellerProducts', async () => {
      const query = { limit: 10 };
      vi.mocked(service.findSellerProducts).mockResolvedValue({ products: [] } as any);

      const result = await controller.findSellerProducts('user-123', query);

      expect(service.findSellerProducts).toHaveBeenCalledWith('user-123', query);
      expect(result.data.products).toEqual([]);
    });
  });

  // ─── findAdminProducts ────────────────────────────────────────────────────
  describe('findAdminProducts', () => {
    it('calls service.findAdminProducts', async () => {
      const query = { limit: 10 };
      vi.mocked(service.findAdminProducts).mockResolvedValue({ products: [] } as any);

      const result = await controller.findAdminProducts(query);

      expect(service.findAdminProducts).toHaveBeenCalledWith(query);
      expect(result.data.products).toEqual([]);
    });
  });

  // ─── addImages ────────────────────────────────────────────────────────────
  describe('addImages', () => {
    it('parses request files and calls service.addImages', async () => {
      vi.mocked(parseMultipartForm).mockResolvedValue({
        fields: {},
        filePaths: ['temp/img1.jpg'],
      });
      vi.mocked(service.addImages).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.addImages('prod-123', 'user-123', UserRole.SELLER, mockRequest);

      expect(parseMultipartForm).toHaveBeenCalledWith(mockRequest, []);
      expect(service.addImages).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER, ['temp/img1.jpg']);
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── removeImage ──────────────────────────────────────────────────────────
  describe('removeImage', () => {
    it('calls service.removeImage with index', async () => {
      vi.mocked(service.removeImage).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.removeImage('prod-123', '0', 'user-123', UserRole.SELLER);

      expect(service.removeImage).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER, 0);
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── findRelatedProducts ──────────────────────────────────────────────────
  describe('findRelatedProducts', () => {
    it('calls service.findRelatedProducts', async () => {
      vi.mocked(service.findRelatedProducts).mockResolvedValue({ products: [] } as any);

      const result = await controller.findRelatedProducts('prod-123');

      expect(service.findRelatedProducts).toHaveBeenCalledWith('prod-123');
      expect(result.data.products).toEqual([]);
    });
  });

  // ─── setRelatedProducts ───────────────────────────────────────────────────
  describe('setRelatedProducts', () => {
    it('calls service.setRelatedProducts', async () => {
      const dto = { relatedProductIds: ['prod-456'] };
      vi.mocked(service.setRelatedProducts).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.setRelatedProducts('prod-123', 'user-123', UserRole.SELLER, dto);

      expect(service.setRelatedProducts).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER, dto);
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });

  // ─── removeRelatedProduct ─────────────────────────────────────────────────
  describe('removeRelatedProduct', () => {
    it('calls service.removeRelatedProduct', async () => {
      vi.mocked(service.removeRelatedProduct).mockResolvedValue({ id: 'prod-123' } as any);

      const result = await controller.removeRelatedProduct('prod-123', 'prod-456', 'user-123', UserRole.SELLER);

      expect(service.removeRelatedProduct).toHaveBeenCalledWith('prod-123', 'user-123', UserRole.SELLER, 'prod-456');
      expect(result.data).toEqual({ id: 'prod-123' });
    });
  });
});