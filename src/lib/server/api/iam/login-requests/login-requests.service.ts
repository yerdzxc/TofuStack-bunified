import { inject, injectable } from '@needle-di/core';
import { LoginRequestsRepository } from './login-requests.repository';
import { MailerService } from '../../mail/mailer.service';
import { LoginVerificationEmail } from '../../mail/templates/login-verification.template';
import { BadRequest, Unauthorized } from '../../common/utils/exceptions';
import { WelcomeEmail } from '../../mail/templates/welcome.template';
import type { VerifyLoginRequestDto } from './dtos/verify-login-request.dto';
import type { CreateLoginRequestDto } from './dtos/create-login-request.dto';
import type { LoginWithPasswordDto } from './dtos/login-with-password.dto';
import { UsersService } from '../../users/users.service';
import { UsersRepository } from '../../users/users.repository';
import { VerificationCodesService } from '../../common/services/verification-codes.service';
import { PasetoService } from '../../common/services/paseto.service';
import { HashingService } from '../../common/services/hashing.service';

@injectable()
export class LoginRequestsService {
	constructor(
		private loginRequestsRepository = inject(LoginRequestsRepository),
		private usersRepository = inject(UsersRepository),
		private verificationCodesService = inject(VerificationCodesService),
		private usersService = inject(UsersService),
		private pasetoService = inject(PasetoService),
		private hashingService = inject(HashingService),
		private mailer = inject(MailerService)
	) {}

	async loginWithPassword({ email, password }: LoginWithPasswordDto) {
		const user = await this.usersRepository.findOneByEmail(email);

		if (!user || !user.password) {
			throw Unauthorized('Invalid credentials');
		}

		const isValid = await this.hashingService.compare(password, user.password);

		if (!isValid) {
			throw Unauthorized('Invalid credentials');
		}

		const tokens = await this.pasetoService.generateTokenPair(user.id, email);

		return {
			user: { id: user.id, email: user.email },
			...tokens
		};
	}

	async register({ email, password }: { email: string; password: string }) {
		const existingUser = await this.usersRepository.findOneByEmail(email);

		if (existingUser) {
			throw BadRequest('Email already registered');
		}

		const hashedPassword = await this.hashingService.hash(password);
		const user = await this.usersService.create(email, hashedPassword);

		await this.mailer.send({
			to: email,
			template: new WelcomeEmail()
		});

		const tokens = await this.pasetoService.generateTokenPair(user.id, email);

		return {
			user: { id: user.id, email: user.email },
			...tokens
		};
	}

	async verify({ email, code }: VerifyLoginRequestDto) {
		const loginRequest = await this.loginRequestsRepository.get(email);

		if (!loginRequest) throw BadRequest('Invalid code');

		const isValid = await this.verificationCodesService.verify({
			verificationCode: code,
			hashedVerificationCode: loginRequest.hashedCode
		});

		if (!isValid) throw BadRequest('Invalid code');

		await this.loginRequestsRepository.delete(email);

		const existingUser = await this.usersRepository.findOneByEmail(email);

		const user = existingUser ? existingUser : await this.authNewUser({ email });

		const tokens = await this.pasetoService.generateTokenPair(user.id, email);

		return {
			user: { id: user.id, email: user.email },
			...tokens
		};
	}

	async sendVerificationCode({ email }: CreateLoginRequestDto) {
		await this.loginRequestsRepository.delete(email);

		const { verificationCode, hashedVerificationCode } =
			await this.verificationCodesService.generateCodeWithHash();

		await this.loginRequestsRepository.set({
			email,
			hashedCode: hashedVerificationCode
		});

		await this.mailer.send({
			to: email,
			template: new LoginVerificationEmail(verificationCode)
		});
	}

	private async authNewUser({ email }: { email: string }) {
		const user = await this.usersService.create(email);

		await this.mailer.send({
			to: email,
			template: new WelcomeEmail()
		});

		return user;
	}
}
