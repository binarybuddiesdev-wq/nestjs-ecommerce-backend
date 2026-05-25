import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {

    const databaseUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV ?? 'development';

    if (!databaseUrl && nodeEnv !== 'test') {
        throw new Error('DATABASE_URL is required but not defined in environment variables');
    }

    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
        throw new Error('NODE_ENV must be one of: development, production, test');
    }

    return {
        port: process.env.PORT ? Number(process.env.PORT) : 5000,
        nodeEnv,
        databaseUrl: databaseUrl ?? '',
    };

});