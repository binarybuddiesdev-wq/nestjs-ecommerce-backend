import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { redisStore } from 'cache-manager-ioredis-yet';

import appConfig from './config/app.config.js';
import { loggerConfig, validateEnv } from './config/index.js';
import { SanitizeMiddleware } from './common/index.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { CartModule } from './modules/cart/cart.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig], validate: validateEnv }),
        LoggerModule.forRoot(loggerConfig),
        CacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                store: await redisStore({
                    host: config.get<string>('REDIS_HOST'),
                    port: config.get<number>('REDIS_PORT'),
                }),
                ttl: 300_000,
            }),
        }),
        PrismaModule, HealthModule, AuthModule, CloudinaryModule, UsersModule, CategoriesModule,
        ProductsModule, UploadsModule, CartModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(SanitizeMiddleware)
            .forRoutes('*');
    }

}