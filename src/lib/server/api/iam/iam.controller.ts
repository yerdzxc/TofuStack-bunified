import { inject, injectable } from '@needle-di/core';
import { zValidator } from '@hono/zod-validator';
import { setCookie } from 'hono/cookie';
import { z } from 'zod';
import { createLoginRequestDto } from './login-requests/dtos/create-login-request.dto';
import { LoginRequestsService } from './login-requests/login-requests.service';
import { verifyLoginRequestDto } from './login-requests/dtos/verify-login-request.dto';
import { loginWithPasswordDto } from './login-requests/dtos/login-with-password.dto';
import { Controller } from '../common/factories/controllers.factory';
import { ConfigService } from '../common/configs/config.service';
import { PasetoService } from '../common/services/paseto.service';

const REFRESH_COOKIE_NAME = 'refresh_token';

const registerDto = z.object({
	email: z.string().email(),
	password: z.string().min(8)
});

@injectable()
export class IamController extends Controller {
	constructor(
		private loginRequestsService = inject(LoginRequestsService),
		private pasetoService = inject(PasetoService),
		private configService = inject(ConfigService)
	) {
		super();
	}

	private setRefreshCookie(c: any, refreshToken: string) {
		setCookie(c, REFRESH_COOKIE_NAME, refreshToken, {
			httpOnly: true,
			secure: this.configService.envs.ENV === 'prod',
			sameSite: 'strict',
			path: '/api/iam',
			maxAge: this.pasetoService.getRefreshTokenTTL()
		});
	}

	routes() {
		return this.controller
			.post('/login', zValidator('json', loginWithPasswordDto), async (c) => {
				const result = await this.loginRequestsService.loginWithPassword(c.req.valid('json'));
				this.setRefreshCookie(c, result.refreshToken);
				return c.json({
					user: result.user,
					accessToken: result.accessToken,
					expiresIn: result.expiresIn
				});
			})
			.post('/register', zValidator('json', registerDto), async (c) => {
				const result = await this.loginRequestsService.register(c.req.valid('json'));
				this.setRefreshCookie(c, result.refreshToken);
				return c.json({
					user: result.user,
					accessToken: result.accessToken,
					expiresIn: result.expiresIn
				});
			})
			.post('/login/request', zValidator('json', createLoginRequestDto), async (c) => {
				await this.loginRequestsService.sendVerificationCode(c.req.valid('json'));
				return c.json({ message: 'Verification code sent' });
			})
			.post('/login/verify', zValidator('json', verifyLoginRequestDto), async (c) => {
				const result = await this.loginRequestsService.verify(c.req.valid('json'));
				this.setRefreshCookie(c, result.refreshToken);
				return c.json({
					user: result.user,
					accessToken: result.accessToken,
					expiresIn: result.expiresIn
				});
			});
	}
}
