import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { LoginDto, RefreshDto, RegisterDto } from './dto/index.js';
import { AuthService } from './auth.service.js';
import { ApiTags as ApiTagsEnum, APIOperation, ApiRoutes, CurrentUser, loggedInUserSuccessMessage, LoginUserResponse, loginUserSuccessMessage, LogoutUserResponse, logoutSuccessMessage, MeUserResponse, Public, RefreshUserResponse, refreshSuccessMessage, RegisterUserResponse, registerUserSuccessMessage } from '@/common/index.js';

@ApiTags(ApiTagsEnum.AUTH)
@Controller('auth')
export class AuthController {

    constructor(
        @InjectPinoLogger(AuthController.name)
        private readonly logger: PinoLogger,
        private readonly authService: AuthService,
    ) { }

    @Public()
    @Post(ApiRoutes.REGISTER)
    @HttpCode(201)
    @ApiOperation({ summary: APIOperation.AUTH_REGISTER })
    @ApiResponse(RegisterUserResponse)
    async register(@Body() registerDto: RegisterDto) {
        this.logger.debug('Registration request received');
        const data = await this.authService.register(registerDto);
        return { message: registerUserSuccessMessage, data }
    }

    @Public()
    @Post(ApiRoutes.LOGIN)
    @HttpCode(200)
    @ApiOperation({ summary: APIOperation.AUTH_LOGIN })
    @ApiResponse(LoginUserResponse)
    async login(@Body() loginDto: LoginDto) {
        this.logger.debug('Login request received');
        const { user, accessToken, refreshToken } = await this.authService.login(loginDto);
        return { message: loginUserSuccessMessage, data: { user, accessToken, refreshToken } }
    }

    @Public()
    @Post(ApiRoutes.REFRESH)
    @HttpCode(200)
    @ApiOperation({ summary: APIOperation.AUTH_REFRESH })
    @ApiResponse(RefreshUserResponse)
    async refresh(@Body() refreshDto: RefreshDto) {
        this.logger.debug('Token refresh request received');
        const data = await this.authService.refresh(refreshDto);
        return { message: refreshSuccessMessage, data }
    }

    @ApiBearerAuth()
    @Post(ApiRoutes.LOGOUT)
    @HttpCode(200)
    @ApiOperation({ summary: APIOperation.AUTH_LOGOUT })
    @ApiResponse(LogoutUserResponse)
    async logout(@CurrentUser('id') userId: string) {
        this.logger.debug({ userId }, 'Logout request received');
        await this.authService.logout(userId);
        return { message: logoutSuccessMessage, data: {} }
    }

    @ApiBearerAuth()
    @Get(ApiRoutes.ME)
    @HttpCode(200)
    @ApiOperation({ summary: APIOperation.AUTH_ME })
    @ApiResponse(MeUserResponse)
    async me(@CurrentUser('id') userId: string) {
        this.logger.debug({ userId }, 'Me request received');
        const data = await this.authService.me(userId);
        return { message: loggedInUserSuccessMessage, data }
    }

}
