import * as crypto from 'node:crypto';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service.js';
import { EMAIL_IN_USE, INVALID_CREDENTIALS, INVALID_REFRESH_TOKEN, USER_NO_LONGER_EXISTS, USER_NOT_FOUND } from '@/common/index.js';
import { LoginDto, RefreshDto, RegisterDto } from './dto/index.js';

@Injectable()
export class AuthService {

    private readonly refreshTokenExpiry: number;

    constructor(
        @InjectPinoLogger(AuthService.name)
        private readonly logger: PinoLogger,
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRY') ?? 7 * 24 * 60 * 60 * 1000;
    }

    async register(dto: RegisterDto) {
        const { email, password, name } = dto;

        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictException(EMAIL_IN_USE);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await this.prisma.user.create({ data: { email, password: hashedPassword, name } });

        this.logger.info({ userId: newUser.id }, 'User registered successfully');

        const { password: _, ...result } = newUser;
        return result;

    }

    async login(dto: LoginDto) {

        const { email, password } = dto;

        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        this.logger.info({ isActive: existingUser.isActive, typeof: typeof existingUser.isActive, strict: existingUser.isActive === false }, 'DEBUG isActive check');

        if (existingUser.isActive === false) {
            throw new UnauthorizedException('Account has been deactivated');
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        const payload = { sub: existingUser.id, email: existingUser.email, role: existingUser.role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.generateRefreshToken(existingUser.id);

        this.logger.info({ userId: existingUser.id }, 'User logged in successfully');

        const { password: _, ...user } = existingUser;
        return { user, accessToken, refreshToken };

    }

    async me(userId: string) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new NotFoundException(USER_NOT_FOUND);
        }

        const { password: _, ...user } = existingUser;
        return user;
    }

    async refresh(dto: RefreshDto) {

        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
        });

        if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
            throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
        }

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { isRevoked: true },
        });

        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user) {
            throw new UnauthorizedException(USER_NO_LONGER_EXISTS);
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.generateRefreshToken(user.id);

        this.logger.info({ userId: user.id }, 'Token refreshed successfully');

        return { accessToken, refreshToken };

    }

    async logout(userId: string) {

        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });

        this.logger.info({ userId }, 'User logged out successfully');

    }

    private async generateRefreshToken(userId: string): Promise<string> {

        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + this.refreshTokenExpiry);

        await this.prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });

        return token;

    }

}
