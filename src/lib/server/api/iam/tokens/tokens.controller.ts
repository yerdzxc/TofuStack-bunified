import { inject, injectable } from '@needle-di/core';
import { zValidator } from '@hono/zod-validator';
import { getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { Controller } from '../../common/factories/controllers.factory';
import { PasetoService } from '../../common/services/paseto.service';
import { Unauthorized } from '../../common/utils/exceptions';
import { ConfigService } from '../../common/configs/config.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

const refreshTokenDto = z.object({
  refreshToken: z.string().optional(),
});

@injectable()
export class TokensController extends Controller {
  constructor(
    private pasetoService = inject(PasetoService),
    private configService = inject(ConfigService),
  ) {
    super();
  }

  private setRefreshCookie(c: any, refreshToken: string) {
    setCookie(c, REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.configService.envs.ENV === 'prod',
      sameSite: 'strict',
      path: '/api/iam',
      maxAge: this.pasetoService.getRefreshTokenTTL(),
    });
  }

  private getRefreshTokenFromCookie(c: any): string | undefined {
    return getCookie(c, REFRESH_COOKIE_NAME);
  }

  private clearRefreshCookie(c: any) {
    setCookie(c, REFRESH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: this.configService.envs.ENV === 'prod',
      sameSite: 'strict',
      path: '/api/iam',
      maxAge: 0,
    });
  }

  routes() {
    return this.controller
      .post(
        '/refresh',
        zValidator('json', refreshTokenDto),
        async (c) => {
          const body = c.req.valid('json');
          const refreshToken = body.refreshToken || this.getRefreshTokenFromCookie(c);

          if (!refreshToken) {
            throw Unauthorized('Refresh token required');
          }

          try {
            const payload = await this.pasetoService.verifyRefreshToken(refreshToken);
            const accessToken = await this.pasetoService.signAccessToken(payload.sub, payload.email);

            const isWebClient = !body.refreshToken;
            if (isWebClient) {
              return c.json({
                accessToken,
                expiresIn: this.pasetoService.getAccessTokenTTL(),
              });
            }

            return c.json({
              accessToken,
              refreshToken: await this.pasetoService.signRefreshToken(payload.sub, payload.email),
              expiresIn: this.pasetoService.getAccessTokenTTL(),
            });
          } catch {
            this.clearRefreshCookie(c);
            throw Unauthorized('Invalid or expired refresh token');
          }
        },
      )
      .post('/logout', async (c) => {
        this.clearRefreshCookie(c);
        return c.json({ message: 'Logged out' });
      });
  }
}
