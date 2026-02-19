import { injectable } from '@needle-di/core';

@injectable()
export class HashingService {
	private readonly options = {
		algorithm: 'argon2id' as const,
		memoryCost: 19456,
		timeCost: 2
	};

	hash(data: string): Promise<string> {
		return Bun.password.hash(data, this.options);
	}

	compare(data: string, encrypted: string): Promise<boolean> {
		return Bun.password.verify(data, encrypted);
	}
}
