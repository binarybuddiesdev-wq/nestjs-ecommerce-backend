import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service.js';
import { UserRole } from '@/types/index.js';
import { USER_NOT_FOUND, ALREADY_SELLER, ADDRESS_NOT_FOUND, USER_ALREADY_INACTIVE } from '@/common/index.js';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: PrismaService;
    let cloudinary: CloudinaryService;

    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    };

    beforeEach(async () => {
        const mockPrisma = {
            user: {
                findUnique: vi.fn(),
                update: vi.fn(),
                findMany: vi.fn(),
            },
            refreshToken: {
                updateMany: vi.fn(),
            },
        };

        const mockCloudinary = {
            uploadImage: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getLoggerToken(UsersService.name),
                    useValue: mockLogger,
                },
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: CloudinaryService,
                    useValue: mockCloudinary,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get<PrismaService>(PrismaService);
        cloudinary = module.get<CloudinaryService>(CloudinaryService);
    });

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'John Doe',
        avatar: null,
        role: UserRole.CUSTOMER,
        isActive: true,
        address: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe('getMe', () => {
        it('should return user details without password', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

            const result = await service.getMe('user-1');

            expect(result).not.toHaveProperty('password');
            expect(result.id).toBe(mockUser.id);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.getMe('invalid-id')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('updateMe', () => {
        it('should update name and avatar and return updated user without password', async () => {
            const updateDto = { name: 'John Updated', avatar: 'https://new-avatar.jpg' };
            const updatedUser = { ...mockUser, ...updateDto };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.updateMe('user-1', updateDto);

            expect(result.name).toBe(updateDto.name);
            expect(result.avatar).toBe(updateDto.avatar);
            expect(result).not.toHaveProperty('password');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: updateDto,
            });
        });

        it('should throw NotFoundException on update if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.updateMe('invalid-id', { name: 'New' })).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('deleteMe', () => {
        it('should deactivate user account and revoke all their refresh tokens', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue(mockUser);
            vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });

            await service.deleteMe('user-1');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { isActive: false },
            });
            expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-1', isRevoked: false },
                data: { isRevoked: true },
            });
        });

        it('should throw NotFoundException on delete if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.deleteMe('invalid-id')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('becomeSeller', () => {
        it('should change user role to SELLER', async () => {
            const updatedUser = { ...mockUser, role: UserRole.SELLER };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.becomeSeller('user-1');

            expect(result.role).toBe(UserRole.SELLER);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { role: UserRole.SELLER },
            });
        });

        it('should throw BadRequestException if user is already a SELLER', async () => {
            const sellerUser = { ...mockUser, role: UserRole.SELLER };
            vi.mocked(prisma.user.findUnique).mockResolvedValue(sellerUser);

            await expect(service.becomeSeller('user-1')).rejects.toThrow(
                new BadRequestException(ALREADY_SELLER),
            );
        });

        it('should throw NotFoundException if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.becomeSeller('invalid-id')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('addAddress', () => {
        it('should add address to the user profile', async () => {
            const addressDto = {
                label: 'Work',
                street: '456 Office Rd',
                city: 'Hyderabad',
                state: 'Telangana',
                zipCode: '500081',
                country: 'INDIA',
                isDefault: false,
            };
            const updatedUser = { ...mockUser, address: [{ id: 'random-uuid', ...addressDto }] };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.addAddress('user-1', addressDto);

            expect(result.address.length).toBe(1);
            expect(result.address[0].label).toBe(addressDto.label);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {
                    address: {
                        push: expect.objectContaining(addressDto),
                    },
                },
            });
        });

        it('should throw NotFoundException on addAddress if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.addAddress('invalid-id', {} as any)).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('listAddress', () => {
        it('should return user addresses', async () => {
            const userWithAddresses = {
                ...mockUser,
                address: [{ id: 'addr-1', label: 'Home', street: '123 St', city: 'Hyd', state: 'TS', zipCode: '1', country: 'IN', isDefault: true }],
            };
            vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAddresses);

            const result = await service.listAddress('user-1');

            expect(result.length).toBe(1);
            expect(result[0].id).toBe('addr-1');
        });

        it('should throw NotFoundException on listAddress if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.listAddress('invalid-id')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('updateAddress', () => {
        const existingAddress = { id: 'addr-1', label: 'Home', street: '123 St', city: 'Hyd', state: 'TS', zipCode: '1', country: 'IN', isDefault: true };
        const userWithAddress = {
            ...mockUser,
            address: [existingAddress],
        };

        it('should update specific address by id', async () => {
            const updateDto = { street: '456 New St' };
            const updatedUser = {
                ...mockUser,
                address: [{ ...existingAddress, ...updateDto }],
            };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAddress);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.updateAddress('user-1', 'addr-1', updateDto);

            expect(result.address[0].street).toBe('456 New St');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {
                    address: {
                        set: [{ ...existingAddress, ...updateDto }],
                    },
                },
            });
        });

        it('should throw NotFoundException if address id is not found in user list', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAddress);

            await expect(service.updateAddress('user-1', 'invalid-addr-id', { street: '1' })).rejects.toThrow(
                new NotFoundException(ADDRESS_NOT_FOUND),
            );
        });

        it('should throw NotFoundException on updateAddress if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.updateAddress('invalid-id', 'addr-1', { street: '1' })).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('deleteAddress', () => {
        const existingAddress = { id: 'addr-1', label: 'Home', street: '123 St', city: 'Hyd', state: 'TS', zipCode: '1', country: 'IN', isDefault: true };
        const userWithAddress = {
            ...mockUser,
            address: [existingAddress],
        };

        it('should remove address by id', async () => {
            const updatedUser = { ...mockUser, address: [] };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAddress);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.deleteAddress('user-1', 'addr-1');

            expect(result.address.length).toBe(0);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: {
                    address: {
                        set: [],
                    },
                },
            });
        });

        it('should throw NotFoundException if address id is not found', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAddress);

            await expect(service.deleteAddress('user-1', 'invalid-addr-id')).rejects.toThrow(
                new NotFoundException(ADDRESS_NOT_FOUND),
            );
        });

        it('should throw NotFoundException on deleteAddress if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.deleteAddress('invalid-id', 'addr-1')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('uploadAvatar', () => {
        it('should call cloudinary upload and update user avatar url', async () => {
            const fileUrl = 'https://cloudinary/avatar.jpg';
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(cloudinary.uploadImage).mockResolvedValue(fileUrl);
            vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, avatar: fileUrl });

            const result = await service.uploadAvatar('user-1', 'temp/file.jpg');

            expect(cloudinary.uploadImage).toHaveBeenCalledWith('temp/file.jpg');
            expect(result.avatar).toBe(fileUrl);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { avatar: fileUrl },
            });
        });

        it('should throw NotFoundException on uploadAvatar if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.uploadAvatar('invalid-id', 'temp/file.jpg')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('listAllUsers', () => {
        it('should return all users without password field', async () => {
            vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser]);

            const result = await service.listAllUsers();

            expect(result.length).toBe(1);
            expect(result[0]).not.toHaveProperty('password');
            expect(prisma.user.findMany).toHaveBeenCalled();
        });
    });

    describe('adminUpdateRole', () => {
        it('should update user role by admin', async () => {
            const updatedUser = { ...mockUser, role: UserRole.ADMIN };
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

            const result = await service.adminUpdateRole('user-1', { role: UserRole.ADMIN });

            expect(result.role).toBe(UserRole.ADMIN);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { role: UserRole.ADMIN },
            });
        });

        it('should throw NotFoundException if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.adminUpdateRole('invalid-id', { role: UserRole.ADMIN })).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });

    describe('adminDeleteUser', () => {
        it('should soft delete user and revoke tokens', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, isActive: false });
            vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 });

            const result = await service.adminDeleteUser('user-1');

            expect(result.isActive).toBe(false);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { isActive: false },
            });
            expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-1', isRevoked: false },
                data: { isRevoked: true },
            });
        });

        it('should throw BadRequestException if user is already inactive', async () => {
            const inactiveUser = { ...mockUser, isActive: false };
            vi.mocked(prisma.user.findUnique).mockResolvedValue(inactiveUser);

            await expect(service.adminDeleteUser('user-1')).rejects.toThrow(
                new BadRequestException(USER_ALREADY_INACTIVE),
            );
        });

        it('should throw NotFoundException if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            await expect(service.adminDeleteUser('invalid-id')).rejects.toThrow(
                new NotFoundException(USER_NOT_FOUND),
            );
        });
    });
});
