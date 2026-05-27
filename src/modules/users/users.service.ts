import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';

import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service.js';
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto, UpdateUserRoleDto } from './dto/index.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { UserRole } from '@/types/index.js';
import { USER_NOT_FOUND, ALREADY_SELLER, ADDRESS_NOT_FOUND, USER_ALREADY_INACTIVE } from '@/common/index.js';



@Injectable()
export class UsersService {

    constructor(
        @InjectPinoLogger(UsersService.name)
        private readonly logger: PinoLogger,
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const { password, ...rest } = user;
        return rest;

    }

    async updateMe(userId: string, dto: UpdateUserDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId }, data: dto
        });

        const { password: _, ...result } = updatedUser;
        return result;

    }

    async deleteMe(userId: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
        this.logger.info({ userId }, 'Account soft deleted');
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });

    }


    async becomeSeller(userId: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        if (user.role === UserRole.SELLER) {
            throw new BadRequestException(ALREADY_SELLER);
        }

        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.SELLER } });
        this.logger.info({ userId, newRole: UserRole.SELLER }, 'User role changed');
        const { password: _, ...result } = updatedUser;
        return result;
    }

    async addAddress(userId: string, dto: CreateAddressDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const uniqueId = crypto.randomUUID();
        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { address: { push: { id: uniqueId, ...dto } } } });
        this.logger.info({ userId, addressId: uniqueId }, 'address added');
        const { password: _, ...result } = updatedUser;
        return result;

    }

    async listAddress(userId: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const { password: _, ...result } = user;
        return result.address;

    }

    async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const addressExist = user.address.some(a => a.id === addressId);
        if (!addressExist) {
            throw new NotFoundException(ADDRESS_NOT_FOUND);
        }

        const updatedAddress = user.address.map((a) => a.id === addressId ? { ...a, ...dto } : a);

        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { address: { set: updatedAddress } } })
        this.logger.info({ userId, addressId }, 'address updated');
        const { password: _, ...result } = updatedUser;
        return result;
    }

    async deleteAddress(userId: string, addressId: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const addressExist = user.address.some((a) => a.id === addressId);
        if (!addressExist) {
            throw new NotFoundException(ADDRESS_NOT_FOUND);
        }

        const updatedAddress = user.address.filter((each) => each.id !== addressId);
        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { address: { set: updatedAddress } } });
        this.logger.info({ userId, addressId }, 'address deleted');
        const { password: _, ...result } = updatedUser;
        return result;

    }

    async listAllUsers() {

        const allUsers = await this.prisma.user.findMany();
        return allUsers.map(({ password, ...rest }) => rest);

    }

    async adminUpdateRole(userId: string, dto: UpdateUserRoleDto) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { role: dto.role } });
        this.logger.info({ userId, newRole: dto.role }, 'user role updated');
        const { password: _, ...result } = updatedUser;
        return result;
    }

    async uploadAvatar(userId: string, filePath: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const avatarUrl = await this.cloudinaryService.uploadImage(filePath);
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });

        this.logger.info({ userId, avatarUrl }, 'avatar uploaded');
        const { password: _, ...result } = updatedUser;
        return result;
    }

    async adminDeleteUser(userId: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const isUserInactive = user.isActive;
        if (!isUserInactive) {
            throw new BadRequestException(USER_ALREADY_INACTIVE);
        }

        const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        this.logger.info({ userId, isActive: false }, 'user deleted');
        const { password: _, ...rest } = updatedUser;
        return rest;

    }

}
