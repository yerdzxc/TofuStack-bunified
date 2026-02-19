import { rateLimiter } from 'hono-rate-limiter';
import { RedisStore } from 'rate-limit-redis';
import { Container } from '@needle-di/core';
import { RedisService } from '../../databases/redis/redis.service';

const container = new Container();
const redisClient = container.get(RedisService).client;

export function rateLimit({
	limit,
	minutes,
	key = ''
}: {
	limit: number;
	minutes: number;
	key?: string;
}) {
	return rateLimiter({
		windowMs: minutes * 60 * 1000,
		limit,
		standardHeaders: 'draft-6',
		keyGenerator: (c) => {
			const clientKey = c.var.session?.userId || c.req.header('x-forwarded-for');
			const pathKey = key || c.req.routePath;
			return `${clientKey}_${pathKey}`;
		},
		store: new RedisStore({
			// Rate-limit-redis calls: sendCommand('CMD', 'arg1', 'arg2')
			// Bun's RedisClient.send() expects: send('CMD', ['arg1', 'arg2'])
			sendCommand: (command: string, ...args: string[]) => {
				return redisClient.send(command, args);
			}
		}) as never
	});
}
