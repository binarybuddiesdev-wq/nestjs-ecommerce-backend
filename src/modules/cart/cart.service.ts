import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service.js';
import { AddCartItemDto, RemoveCartItemsDto } from './dto/index.js';
import {
    PRODUCT_NOT_FOUND,
    CART_PRODUCT_INACTIVE,
    CART_INSUFFICIENT_STOCK,
    CART_ITEM_NOT_FOUND,
} from '@/common/constants/api.constants.js';

@Injectable()
export class CartService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLogger,
    ) { }

    async addItemToCart(userId: string, dto: AddCartItemDto) {
        const { productId, quantity } = dto;

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (!product.isActive) {
            throw new BadRequestException(CART_PRODUCT_INACTIVE);
        }

        if (product.stock < quantity) {
            throw new BadRequestException(CART_INSUFFICIENT_STOCK);
        }

        const existingCart = await this.prisma.cart.findUnique({ where: { userId } });

        if (!existingCart) {
            const cart = await this.prisma.cart.create({
                data: {
                    userId,
                    items: [{ productId, quantity }],
                },
            });
            this.logger.info({ userId, productId, quantity }, 'Item added to cart');
            return cart;
        }

        const existingItemIndex = existingCart.items.findIndex((item) => item.productId === productId);

        let updatedItems;

        if (existingItemIndex !== -1) {
            const newQuantity = existingCart.items[existingItemIndex].quantity + quantity;

            if (product.stock < newQuantity) {
                throw new BadRequestException(CART_INSUFFICIENT_STOCK);
            }

            updatedItems = existingCart.items.map((item, index) => index === existingItemIndex ? { ...item, quantity: newQuantity } : item);
        } else {
            updatedItems = [...existingCart.items, { productId, quantity }];
        }

        const cart = await this.prisma.cart.update({ where: { userId }, data: { items: updatedItems } });
        this.logger.info({ userId, productId, quantity }, 'Item added to cart');
        return cart;
    }

    async getCart(userId: string) {

        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            return { id: null, userId, items: [], totalAmount: 0, totalItems: 0 };
        }

        const productIds = cart.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, images: true, stock: true, isActive: true, slug: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        let totalAmount = 0;
        let totalItems = 0;

        const enrichedItems = cart.items.map((item) => {
            const product = productMap.get(item.productId);
            totalItems += item.quantity;

            if (product && product.isActive) {
                totalAmount += product.price * item.quantity;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    product: {
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        stock: product.stock,
                        isActive: product.isActive,
                        slug: product.slug,
                    },
                };
            }

            return {
                productId: item.productId,
                quantity: item.quantity,
                product: null,
            };
        });

        this.logger.info({ userId, itemCount: cart.items.length, totalAmount }, 'Cart retrieved');

        return {
            id: cart.id,
            userId: cart.userId,
            items: enrichedItems,
            totalAmount,
            totalItems,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        };
    }

    async removeItemsFromCart(userId: string, dto: RemoveCartItemsDto) {

        const { productIds } = dto;

        const userCart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!userCart) {
            return this.getCart(userId);
        }

        const filteredItems = userCart.items.filter((each) => !productIds.includes(each.productId));

        await this.prisma.cart.update({ where: { userId }, data: { items: filteredItems } });
        this.logger.info({ userId, productIds }, 'Items removed from cart');
        return this.getCart(userId);

    }

    async updateCartItem(userId: string, productId: string, quantity: number) {

        const cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const itemIndex = cart.items.findIndex((item) => item.productId === productId);
        if (itemIndex === -1) {
            throw new NotFoundException(CART_ITEM_NOT_FOUND);
        }

        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException(PRODUCT_NOT_FOUND);
        }

        if (!product.isActive) {
            throw new BadRequestException(CART_PRODUCT_INACTIVE);
        }

        if (product.stock < quantity) {
            throw new BadRequestException(CART_INSUFFICIENT_STOCK);
        }

        const updatedItems = cart.items.map((item, index) =>
            index === itemIndex ? { ...item, quantity } : item,
        );

        await this.prisma.cart.update({ where: { userId }, data: { items: updatedItems } });
        this.logger.info({ userId, productId, quantity }, 'Cart item updated');
        return this.getCart(userId);

    }

}
