import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

const NOW = new Date();

const mockCartService = {
    addItemToCart: vi.fn(),
    getCart: vi.fn(),
    removeItemsFromCart: vi.fn(),
    updateCartItem: vi.fn(),
};

const mockCartResult = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
        {
            productId: 'prod-1',
            quantity: 2,
            product: { name: 'Wireless Mouse', price: 799, images: [], stock: 15, isActive: true, slug: 'wireless-mouse' },
        },
    ],
    totalAmount: 1598,
    totalItems: 2,
    createdAt: NOW,
    updatedAt: NOW,
};

describe('CartController', () => {
    let controller: CartController;

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
            controllers: [CartController],
            providers: [{ provide: CartService, useValue: mockCartService }],
        }).compile();

        controller = module.get<CartController>(CartController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('addItemToCart', () => {
        it('delegates to service and wraps response', async () => {
            mockCartService.addItemToCart.mockResolvedValue(mockCartResult);

            const result = await controller.addItemToCart('user-1', {
                productId: 'prod-1',
                quantity: 2,
            });

            expect(mockCartService.addItemToCart).toHaveBeenCalledWith('user-1', {
                productId: 'prod-1',
                quantity: 2,
            });
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('data');
            expect(result.data).toEqual(mockCartResult);
        });
    });

    describe('getCart', () => {
        it('delegates to service and wraps response', async () => {
            mockCartService.getCart.mockResolvedValue(mockCartResult);

            const result = await controller.getCart('user-1');

            expect(mockCartService.getCart).toHaveBeenCalledWith('user-1');
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('data');
            expect(result.data).toEqual(mockCartResult);
        });
    });

    describe('removeItemsFromCart', () => {
        it('delegates to service and wraps response', async () => {
            mockCartService.removeItemsFromCart.mockResolvedValue(mockCartResult);

            const result = await controller.removeItemsFromCart('user-1', {
                productIds: ['prod-1'],
            });

            expect(mockCartService.removeItemsFromCart).toHaveBeenCalledWith('user-1', {
                productIds: ['prod-1'],
            });
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('data');
        });
    });

    describe('updateCartItem', () => {
        it('delegates to service and wraps response', async () => {
            mockCartService.updateCartItem.mockResolvedValue(mockCartResult);

            const result = await controller.updateCartItem('user-1', 'prod-1', { quantity: 5 });

            expect(mockCartService.updateCartItem).toHaveBeenCalledWith('user-1', 'prod-1', 5);
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('data');
        });
    });
});
