import * as crypto from 'node:crypto';
import { generateKeys } from 'paseto-ts/v4';

const getRandomValues = (array: Uint8Array): Uint8Array => {
    const bytes = crypto.randomBytes(array.length);
    array.set(bytes);
    return array;
};

console.log('Generating PASETO local key...');

const localKey = await generateKeys('local', { format: 'paserk', getRandomValues });

console.log('\n========================================');
console.log('PASETO LOCAL KEY GENERATED');
console.log('========================================\n');

console.log('Add this to your .env file:\n');
console.log(`PASETO_LOCAL_KEY_PASERK=${localKey}\n`);

console.log('========================================');
console.log('IMPORTANT: Store this key securely!');
console.log('Never commit actual keys to git!');
console.log('========================================\n');
