import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Readable } from 'stream';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto } from './dto/index.js';
import { UserRole } from '@/types/index.js';
import {
    GET_ME_SUCCESS,
    UPDATE_ME_SUCCESS,
    DELETE_ME_SUCCESS,
    BECOME_SELLER_SUCCESS,
    ADD_ADDRESS_SUCCESS,
    LIST_ADDRESSES_SUCCESS,
    UPDATE_ADDRESS_SUCCESS,
    DELETE_ADDRESS_SUCCESS,
    AVATAR_UPLOAD_SUCCESS,
    NO_FILE_UPLOADED
} from '@/common/index.js';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'John Doe',
        avatar: null,
        role: UserRole.CUSTOMER,
        isActive: true,
        address: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUsersService = {
        getMe: vi.fn(),
        updateMe: vi.fn(),
        deleteMe: vi.fn(),
        becomeSeller: vi.fn(),
        addAddress: vi.fn(),
        listAddress: vi.fn(),
        updateAddress: vi.fn(),
        deleteAddress: vi.fn(),
        uploadAvatar: vi.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    describe('me', () => {
        it('should call service.getMe and return profile', async () => {
            vi.mocked(service.getMe).mockResolvedValue(mockUser);

            const result = await controller.me('user-1');

            expect(service.getMe).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: GET_ME_SUCCESS, data: mockUser });
        });
    });

    describe('updateMe', () => {
        it('should call service.updateMe with correct parameters', async () => {
            const dto: UpdateUserDto = { name: 'John Updated' };
            const updated = { ...mockUser, name: 'John Updated' };
            vi.mocked(service.updateMe).mockResolvedValue(updated);

            const result = await controller.updateMe('user-1', dto);

            expect(service.updateMe).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual({ message: UPDATE_ME_SUCCESS, data: updated });
        });
    });

    describe('deleteMe', () => {
        it('should call service.deleteMe', async () => {
            vi.mocked(service.deleteMe).mockResolvedValue(undefined as any);

            const result = await controller.deleteMe('user-1');

            expect(service.deleteMe).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: DELETE_ME_SUCCESS, data: {} });
        });
    });

    describe('becomeSeller', () => {
        it('should call service.becomeSeller', async () => {
            const seller = { ...mockUser, role: UserRole.SELLER };
            vi.mocked(service.becomeSeller).mockResolvedValue(seller);

            const result = await controller.becomeSeller('user-1');

            expect(service.becomeSeller).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: BECOME_SELLER_SUCCESS, data: seller });
        });
    });

    describe('addAddress', () => {
        it('should call service.addAddress', async () => {
            const dto: CreateAddressDto = {
                label: 'Home',
                street: '123 St',
                city: 'Hyd',
                state: 'TS',
                zipCode: '1',
                country: 'IN',
                isDefault: true,
            };
            const updated = { ...mockUser, address: [{ id: 'addr-1', ...dto, isDefault: true }] };
            vi.mocked(service.addAddress).mockResolvedValue(updated);

            const result = await controller.addAddress('user-1', dto);

            expect(service.addAddress).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual({ message: ADD_ADDRESS_SUCCESS, data: updated });
        });
    });

    describe('listAddress', () => {
        it('should call service.listAddress', async () => {
            const addresses = [{ id: 'addr-1', label: 'Home', street: '123 St', city: 'Hyd', state: 'TS', zipCode: '1', country: 'IN', isDefault: true }];
            vi.mocked(service.listAddress).mockResolvedValue(addresses as any);

            const result = await controller.listAddress('user-1');

            expect(service.listAddress).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: LIST_ADDRESSES_SUCCESS, data: addresses });
        });
    });

    describe('updateAddress', () => {
        it('should call service.updateAddress', async () => {
            const dto: UpdateAddressDto = { street: 'New St' };
            const updated = { ...mockUser, address: [{ id: 'addr-1', label: 'Home', street: 'New St', city: 'Hyd', state: 'TS', zipCode: '1', country: 'IN', isDefault: true }] };
            vi.mocked(service.updateAddress).mockResolvedValue(updated);

            const result = await controller.updateAddress('user-1', 'addr-1', dto);

            expect(service.updateAddress).toHaveBeenCalledWith('user-1', 'addr-1', dto);
            expect(result).toEqual({ message: UPDATE_ADDRESS_SUCCESS, data: updated });
        });
    });

    describe('deleteAddress', () => {
        it('should call service.deleteAddress', async () => {
            vi.mocked(service.deleteAddress).mockResolvedValue(mockUser);

            const result = await controller.deleteAddress('user-1', 'addr-1');

            expect(service.deleteAddress).toHaveBeenCalledWith('user-1', 'addr-1');
            expect(result).toEqual({ message: DELETE_ADDRESS_SUCCESS, data: mockUser });
        });
    });

    describe('uploadAvatar', () => {
        it('should throw BadRequestException if request has no file', async () => {
            const mockReq = {
                file: vi.fn().mockResolvedValue(null),
            } as unknown as FastifyRequest;

            await expect(controller.uploadAvatar('user-1', mockReq)).rejects.toThrow(
                new BadRequestException(NO_FILE_UPLOADED),
            );
        });

        it('should upload avatar and call usersService.uploadAvatar', async () => {
            const mockReq = {
                file: vi.fn().mockResolvedValue({
                    file: Readable.from(['file-data']),
                    filename: 'avatar.png',
                }),
            } as unknown as FastifyRequest;

            const updatedUser = { ...mockUser, avatar: 'https://cloudinary/avatar.png' };
            vi.mocked(service.uploadAvatar).mockResolvedValue(updatedUser);

            const result = await controller.uploadAvatar('user-1', mockReq);

            expect(service.uploadAvatar).toHaveBeenCalledWith('user-1', expect.any(String));
            expect(result).toEqual({ message: AVATAR_UPLOAD_SUCCESS, data: updatedUser });
        });
    });
});
