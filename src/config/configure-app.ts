import { Logger } from "nestjs-pino";
import { NestFastifyApplication } from "@nestjs/platform-fastify";

import { registerFastifyPlugins, registerGlobalMiddleware, setupSwagger } from "./index.js";

export const configureApp = async (app: NestFastifyApplication) => {

    const nodeEnv = process.env.NODE_ENV ?? 'development';

    app.useLogger(app.get(Logger));
    registerGlobalMiddleware(app);
    await registerFastifyPlugins(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    if (nodeEnv !== 'production') {
        setupSwagger(app);
    }
    app.enableShutdownHooks();

};