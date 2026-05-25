import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import appConfig from './config/app.config.js';
import { loggerConfig, } from './config/index.js';
import { SanitizeMiddleware } from './common/index.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        LoggerModule.forRoot(loggerConfig),
        PrismaModule, HealthModule
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