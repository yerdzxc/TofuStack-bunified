import { RedisClient } from 'bun';
import { inject, injectable } from '@needle-di/core';
import { ConfigService } from '../../common/configs/config.service';

@injectable()
export class RedisService {
	public client: RedisClient;

	constructor(private configService = inject(ConfigService)) {
		this.client = new RedisClient(this.configService.envs.REDIS_URL);
		this.client.connect();
	}

	async get(data: { prefix: string; key: string }): Promise<string | null> {
		return this.client.get(`${data.prefix}:${data.key}`);
	}

	async set(data: { prefix: string; key: string; value: string }): Promise<void> {
		await this.client.set(`${data.prefix}:${data.key}`, data.value);
	}

	async delete(data: { prefix: string; key: string }): Promise<void> {
		await this.client.del(`${data.prefix}:${data.key}`);
	}

	async setWithExpiry(data: {
		prefix: string;
		key: string;
		value: string;
		expiry: number;
	}): Promise<void> {
		await this.client.set(`${data.prefix}:${data.key}`, data.value);
		await this.client.expire(`${data.prefix}:${data.key}`, data.expiry);
	}

	async incr(key: string): Promise<number> {
		return this.client.incr(key);
	}

	async expire(key: string, seconds: number): Promise<void> {
		await this.client.expire(key, seconds);
	}
}
