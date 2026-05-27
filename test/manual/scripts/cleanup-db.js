import { PrismaService } from 'file:///c:/antigravity-test/nestjs-ecommerce-backend/dist/src/prisma/prisma.service.js';

const prisma = new PrismaService();

async function run() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        const emails = [
            'verify.customer@example.com',
            'verify.seller@example.com',
            'bugfix.test@example.com'
        ];
        const users = await prisma.user.findMany({
            where: { email: { in: emails } }
        });

        const userIds = users.map(u => u.id);
        console.log(`Found ${users.length} existing test users:`, users.map(u => u.email));

        if (userIds.length > 0) {
            const tokenRes = await prisma.refreshToken.deleteMany({
                where: { userId: { in: userIds } }
            });
            console.log('Deleted refresh tokens:', tokenRes);

            const userRes = await prisma.user.deleteMany({
                where: { id: { in: userIds } }
            });
            console.log('Deleted users:', userRes);
        } else {
            console.log('No existing test users found. Clean slate.');
        }

    } catch (e) {
        console.error('Error during database cleanup:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
