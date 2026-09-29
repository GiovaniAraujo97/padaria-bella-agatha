import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function readPassword() {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    process.stdout.write('Senha administrativa: ');
    return new Promise((resolve) => {
      let password = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => { password += chunk; });
      process.stdin.on('end', () => {
        process.stdout.write('\n');
        resolve(password.replace(/[\r\n]+$/, ''));
      });
    });
  }

  return new Promise((resolve, reject) => {
    let password = '';
    process.stdout.write('Senha administrativa: ');
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    const finish = (value) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          process.stdin.off('data', onData);
          process.stdin.setRawMode(false);
          process.exit(130);
        } else if (character === '\r' || character === '\n') {
          finish(password);
          return;
        } else if (character === '\u007f' || character === '\b') {
          password = Array.from(password).slice(0, -1).join('');
        } else {
          password += character;
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

const password = await readPassword();
if (password.length < 12) throw new Error('Use uma senha administrativa com pelo menos 12 caracteres.');
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const passwordSetting = `ADMIN_PASSWORD_HASH=${salt}:${hash}`;

if (process.argv.includes('--update-env')) {
  const envPath = resolve('.env');
  const environment = await readFile(envPath, 'utf8');
  if (!/^ADMIN_PASSWORD_HASH=.*$/m.test(environment)) throw new Error('ADMIN_PASSWORD_HASH não encontrado em .env.');
  await writeFile(envPath, environment.replace(/^ADMIN_PASSWORD_HASH=.*$/m, passwordSetting), { encoding: 'utf8' });
  console.log('Senha atualizada em .env. Reinicie o servidor para aplicar.');
} else {
  console.log(passwordSetting);
}