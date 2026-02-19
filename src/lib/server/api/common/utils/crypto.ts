// generateId is a function that returns a new unique identifier.
// Uses crypto.randomUUID() which generates UUID v4
// ~4 million years or 30 trillion IDs needed, in order to have a 1% probability of at least one collision.

export function generateId(
	length = 16,
	alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
) {
	const uuid = crypto.randomUUID().replace(/-/g, '');
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet[parseInt(uuid[i % uuid.length], 16) % alphabet.length];
	}
	return result;
}

export { randomUUID } from 'node:crypto';
