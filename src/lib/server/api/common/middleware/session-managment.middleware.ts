import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

export const sessionManagement: MiddlewareHandler = createMiddleware(async (c, next) => {
  return next();
});
