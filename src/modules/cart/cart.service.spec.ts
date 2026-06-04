import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CartService } from './cart.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import {
    PRODUCT_NOT_FOUND,
    CART_PRODUCT_INACTIVE,
    CART_INSUFFICIENT_STOCK,
    CART_ITEM_NOT_FOUND,
} from '@/common/constants/api.constants.js';

describe('CartService', () => {
    let service: CartService;
    let prisma: PrismaService;

    const mockPrismaService = {
        cart: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        product: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
    };

    const mockLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    const NOW = new Date();
    const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [
            { productId: 'prod-1', quantity: 2 },
            { productId: 'prod-2', quantity: 1 },
        ],
        createdAt: NOW,
        updatedAt: NOW,
    };

    const mockEmptyCart = {
        id: null,
        userId: 'user-1',
        items: [],
        totalAmount: 0,
        totalItems: 0,
    };

    const baseProduct = {
        description: '',
        brand: null,
        compareAtPrice: null,
        soldCount: 0,
        tags: [] as string[],
        weight: null,
        dimensions: null,
        warrantyInfo: null,
        expiryDate: null,
        rating: 0,
        ratingCount: 0,
        reviewCount: 0,
        relatedProductIds: [] as string[],
        categoryId: 'cat-1',
        sellerId: 'seller-1',
        createdAt: NOW,
        updatedAt: NOW,
    };

    const mockProduct1 = {
        ...baseProduct,
        id: 'prod-1',
        name: 'Wireless Mouse',
        price: 799,
        images: ['mouse.jpg'],
        stock: 15,
        isActive: true,
        slug: 'wireless-mouse',
    };

    const mockProduct2 = {
        ...baseProduct,
        id: 'prod-2',
        name: 'Keyboard',
        price: 2499,
        images: ['keyboard.jpg'],
        stock: 8,
        isActive: true,
        slug: 'keyboard',
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: PinoLogger, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ─── addItemToCart ────────────────────────────────────────────────────────
    describe('addItemToCart', () => {
        it('creates new cart if none exists', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct1);
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.cart.create).mockResolvedValue(mockCart);

            const result = await service.addItemToCart('user-1', {
                productId: 'prod-1',
                quantity: 2,
            });

            expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
            expect(prisma.cart.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    items: [{ productId: 'prod-1', quantity: 2 }],
                },
            });
        });

        it('adds new item to existing cart', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct2);
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.cart.update).mockResolvedValue({
                ...mockCart,
                items: [...mockCart.items, { productId: 'prod-3', quantity: 1 }],
            });

            const result = await service.addItemToCart('user-1', {
                productId: 'prod-3',
                quantity: 1,
            });

            expect(prisma.cart.update).toHaveBeenCalled();
        });

        it('increases quantity if item already exists in cart', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct1);
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.cart.update).mockResolvedValue({
                ...mockCart,
                items: [{ productId: 'prod-1', quantity: 5 }],
            });

            await service.addItemToCart('user-1', { productId: 'prod-1', quantity: 3 });

            expect(prisma.cart.update).toHaveBeenCalled();
            const updateCall = vi.mocked(prisma.cart.update).mock.calls[0][0] as any;
            const updatedItem = updateCall.data.items.find((i: any) => i.productId === 'prod-1');
            expect(updatedItem.quantity).toBe(5);
        });

        it('throws NotFoundException if product does not exist', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(
                service.addItemToCart('user-1', { productId: 'prod-99', quantity: 1 }),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException if product is inactive', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                ...mockProduct1,
                isActive: false,
            });

            await expect(
                service.addItemToCart('user-1', { productId: 'prod-1', quantity: 1 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException if stock is insufficient', async () => {
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct1);

            await expect(
                service.addItemToCart('user-1', { productId: 'prod-1', quantity: 100 }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ─── getCart ──────────────────────────────────────────────────────────────
    describe('getCart', () => {
        it('returns empty cart structure if no cart exists', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);

            const result = await service.getCart('user-1');

            expect(result).toEqual({
                id: null,
                userId: 'user-1',
                items: [],
                totalAmount: 0,
                totalItems: 0,
            });
        });

        it('returns cart with enriched items and totals', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct1, mockProduct2]);

            const result = await service.getCart('user-1');

            expect(result.items).toHaveLength(2);
            expect(result.totalItems).toBe(3);
            expect(result.totalAmount).toBe((2 * 799) + (1 * 2499));
            expect(result.items[0].product!.name).toBe('Wireless Mouse');
            expect(result.items[1].product!.name).toBe('Keyboard');
        });

        it('marks product as null if product is inactive or missing', async () => {
            const cartWithInactive = {
                ...mockCart,
                items: [...mockCart.items, { productId: 'prod-99', quantity: 1 }],
            };
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(cartWithInactive);
            vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct1, mockProduct2]);

            const result = await service.getCart('user-1');

            const nullProductItem = result.items.find((i: any) => i.productId === 'prod-99')!;
            expect(nullProductItem.product).toBeNull();
        });
    });

    // ─── removeItemsFromCart ──────────────────────────────────────────────────
    describe('removeItemsFromCart', () => {
        it('removes specified items from cart', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct1, mockProduct2]);

            const result = await service.removeItemsFromCart('user-1', {
                productIds: ['prod-1'],
            });

            expect(prisma.cart.update).toHaveBeenCalled();
            const updateCall = vi.mocked(prisma.cart.update).mock.calls[0][0] as any;
            expect(updateCall.data.items).toHaveLength(1);
            expect(updateCall.data.items[0].productId).toBe('prod-2');
        });

        it('removes multiple items at once', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findMany).mockResolvedValue([]);

            await service.removeItemsFromCart('user-1', {
                productIds: ['prod-1', 'prod-2'],
            });

            const updateCall = vi.mocked(prisma.cart.update).mock.calls[0][0] as any;
            expect(updateCall.data.items).toHaveLength(0);
        });

        it('returns empty cart if no cart exists', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);

            const result = await service.removeItemsFromCart('user-1', {
                productIds: ['prod-1'],
            });

            expect(result.items).toEqual([]);
        });
    });

    // ─── updateCartItem ───────────────────────────────────────────────────────
    describe('updateCartItem', () => {
        it('updates quantity successfully', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct1);
            vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct1, mockProduct2]);

            const result = await service.updateCartItem('user-1', 'prod-1', 5);

            expect(prisma.cart.update).toHaveBeenCalled();
            const updateCall = vi.mocked(prisma.cart.update).mock.calls[0][0] as any;
            const updatedItem = updateCall.data.items.find((i: any) => i.productId === 'prod-1');
            expect(updatedItem.quantity).toBe(5);
        });

        it('throws NotFoundException if cart does not exist', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);

            await expect(
                service.updateCartItem('user-1', 'prod-1', 3),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException if item not in cart', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);

            await expect(
                service.updateCartItem('user-1', 'prod-99', 3),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException if product does not exist', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

            await expect(
                service.updateCartItem('user-1', 'prod-1', 3),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException if product is inactive', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findUnique).mockResolvedValue({
                ...mockProduct1,
                isActive: false,
            });

            await expect(
                service.updateCartItem('user-1', 'prod-1', 3),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException if stock insufficient', async () => {
            vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
            vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct1);

            await expect(
                service.updateCartItem('user-1', 'prod-1', 100),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
