import { encrypt, decrypt } from 'paseto-ts/v4';
import { inject, injectable } from '@needle-di/core';
import { ConfigService } from '../configs/config.service';

export type TokenPayload = {
  sub: string;
  email: string;
  exp?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

const ACCESS_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TTL_DAYS = 7;

@injectable()
export class PasetoService {
  private readonly key: string;

  constructor(private configService = inject(ConfigService)) {
    this.key = this.configService.envs.PASETO_LOCAL_KEY_PASERK;
  }

  async signAccessToken(sub: string, email: string): Promise<string> {
    const exp = new Date();
    exp.setSeconds(exp.getSeconds() + ACCESS_TTL_SECONDS);

    return encrypt(this.key, {
      sub,
      email,
      exp: exp.toISOString(),
    });
  }

  async signRefreshToken(sub: string, email: string): Promise<string> {
    const exp = new Date();
    exp.setDate(exp.getDate() + REFRESH_TTL_DAYS);

    return encrypt(this.key, {
      sub,
      email,
      exp: exp.toISOString(),
    });
  }

  async generateTokenPair(sub: string, email: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(sub, email),
      this.signRefreshToken(sub, email),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TTL_SECONDS,
      refreshExpiresIn: REFRESH_TTL_DAYS * 24 * 60 * 60,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const { payload } = await decrypt<TokenPayload>(this.key, token);
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const { payload } = await decrypt<TokenPayload>(this.key, token);
    return payload;
  }

  getAccessTokenTTL(): number {
    return ACCESS_TTL_SECONDS;
  }

  getRefreshTokenTTL(): number {
    return REFRESH_TTL_DAYS * 24 * 60 * 60;
  }
}
