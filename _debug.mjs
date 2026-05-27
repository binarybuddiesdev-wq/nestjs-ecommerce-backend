import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({ where: { email: 'bugfix.test@example.com' } });
  if (user) {
    console.log('TYPE:', typeof user.isActive);
    console.log('VAL:', user.isActive);
    console.log('===false:', user.isActive === false);
    console.log('!isfalse:', !user.isActive);
    console.log('JSON:', JSON.stringify(user.isActive));
    const desc = Object.getOwnPropertyDescriptor(user, 'isActive');
    console.log('HAS_DESC:', !!desc);
    if (desc) {
      console.log('DESC_VAL:', desc.value);
      console.log('DESC_TYPE:', typeof desc.value);
    }
  } else {
    console.log('USER NOT FOUND');
  }
} catch (e) {
  console.error('ERROR:', e);
} finally {
  await prisma.$disconnect();
}
