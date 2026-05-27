import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { AdminUsersController } from './admin-users.controller.js';
import { UsersService } from './users.service.js';
import { UpdateUserRoleDto } from './dto/index.js';
import { UserRole } from '@/types/index.js';
import {
    LIST_ALL_USERS_SUCCESS,
    UPDATE_USER_ROLE_SUCCESS,
    DELETE_ADMIN_USER_SUCCESS
} from '@/common/index.js';

describe('AdminUsersController', () => {
    let controller: AdminUsersController;
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
        listAllUsers: vi.fn(),
        adminUpdateRole: vi.fn(),
        adminDeleteUser: vi.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminUsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<AdminUsersController>(AdminUsersController);
        service = module.get<UsersService>(UsersService);
    });

    describe('listAllUsers', () => {
        it('should call service.listAllUsers and return list', async () => {
            const users = [mockUser];
            vi.mocked(service.listAllUsers).mockResolvedValue(users as any);

            const result = await controller.listAllUsers();

            expect(service.listAllUsers).toHaveBeenCalled();
            expect(result).toEqual({ message: LIST_ALL_USERS_SUCCESS, data: users });
        });
    });

    describe('adminUpdateRole', () => {
        it('should call service.adminUpdateRole with id and role dto', async () => {
            const dto: UpdateUserRoleDto = { role: UserRole.SELLER };
            const updated = { ...mockUser, role: UserRole.SELLER };
            vi.mocked(service.adminUpdateRole).mockResolvedValue(updated);

            const result = await controller.adminUpdateRole('user-1', dto);

            expect(service.adminUpdateRole).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual({ message: UPDATE_USER_ROLE_SUCCESS, data: updated });
        });
    });

    describe('adminDeleteUser', () => {
        it('should call service.adminDeleteUser with id', async () => {
            const deactivated = { ...mockUser, isActive: false };
            vi.mocked(service.adminDeleteUser).mockResolvedValue(deactivated);

            const result = await controller.adminDeleteUser('user-1');

            expect(service.adminDeleteUser).toHaveBeenCalledWith('user-1');
            expect(result).toEqual({ message: DELETE_ADMIN_USER_SUCCESS, data: {} });
        });
    });
});
