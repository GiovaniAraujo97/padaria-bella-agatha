import { randomBytes, scryptSync } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const email = 'admin@bellaagatha.local';
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const passwordHash = scryptSync(password, salt, 64).toString('hex');
const sessionSecret = randomBytes(48).toString('base64url');
const environment = [
  `ADMIN_EMAIL=${email}`,
  `ADMIN_PASSWORD_HASH=${salt}:${passwordHash}`,
  `SESSION_SECRET=${sessionSecret}`,
  'NODE_ENV=development',
  ''
].join('\n');

try {
  await writeFile(resolve('.env'), environment, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
} catch (error) {
  if (error.code === 'EEXIST') throw new Error('.env já existe; não foi alterado. Guarde-o e configure as variáveis manualmente.');
  throw error;
}

console.log(`E-mail temporário: ${email}`);
console.log(`Senha temporária: ${password}`);
console.log('A senha não pode ser recuperada; guarde-a agora. O .env local contém apenas seu hash.');