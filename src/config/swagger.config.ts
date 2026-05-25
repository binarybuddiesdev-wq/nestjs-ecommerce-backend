import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

export const setupSwagger = (app: NestFastifyApplication) => {
    const config = new DocumentBuilder()
        .setTitle('APP API')
        .setDescription('API documentation for NESTJS service')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'full',
            filter: true,
            showExtensions: true,
            tryItOutEnabled: false,
        }
    });
};
