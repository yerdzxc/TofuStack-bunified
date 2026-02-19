import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { Container } from '@needle-di/core';
import { PasetoService } from '../services/paseto.service';
import { Unauthorized } from '../utils/exceptions';
import type { TokenPayload } from '../services/paseto.service';

type AuthStates = 'session' | 'none';
type AuthedReturnType = typeof authed;
type UnauthedReturnType = typeof unauthed;

export function authState(state: 'session'): AuthedReturnType;
export function authState(state: 'none'): UnauthedReturnType;
export function authState(state: AuthStates): AuthedReturnType | UnauthedReturnType {
  if (state === 'session') return authed;
  return unauthed;
}

const authed: MiddlewareHandler<{
  Variables: {
    user: TokenPayload | null;
  };
}> = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw Unauthorized('Authorization header required');
  }

  const token = authHeader.slice(7);

  try {
    const container = new Container();
    const pasetoService = container.get(PasetoService);
    const payload = await pasetoService.verifyAccessToken(token);
    c.set('user', payload);
  } catch {
    throw Unauthorized('Invalid or expired token');
  }

  return next();
});

const unauthed: MiddlewareHandler<{
  Variables: {
    user: TokenPayload | null;
  };
}> = createMiddleware(async (c, next) => {
  return next();
});
