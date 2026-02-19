import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { inject, injectable } from '@needle-di/core';
import { ConfigService } from '../../common/configs/config.service';
import type { CreateSessionDto } from './dtos/create-session-dto';
import type { SessionDto } from './dtos/session.dto';
import { SessionsRepository } from './sessions.repository';
import { RequestContextService } from '../../common/services/request-context.service';
import { generateId } from '../../common/utils/crypto';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

@injectable()
export class SessionsService {
	private readonly sessionCookieName = 'session';

	constructor(
		private sessionsRepository = inject(SessionsRepository),
		private requestContextService = inject(RequestContextService),
		private configService = inject(ConfigService)
	) {}

	setSessionCookie(session: SessionDto) {
		return setSignedCookie(
			this.requestContextService.getContext(),
			this.sessionCookieName,
			session.id,
			this.configService.envs.SIGNING_SECRET,
			{
				httpOnly: true,
				sameSite: 'lax',
				secure: this.configService.envs.ENV === 'prod',
				path: '/',
				expires: session.expiresAt
			}
		);
	}

	async getSessionCookie(): Promise<string | null> {
		const session = await getSignedCookie(
			this.requestContextService.getContext(),
			this.configService.envs.SIGNING_SECRET,
			this.sessionCookieName
		);
		if (!session) return null;
		return session;
	}

	deleteSessionCookie() {
		return deleteCookie(this.requestContextService.getContext(), this.sessionCookieName);
	}

	async createSession(userId: string): Promise<SessionDto> {
		const now = new Date();
		const session: CreateSessionDto = {
			id: this.generateSessionToken(),
			userId,
			createdAt: now,
			expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS)
		};

		await this.sessionsRepository.create(session);
		return { ...session, fresh: true };
	}

	async validateSession(sessionId: string): Promise<SessionDto | null> {
		const existingSession = await this.sessionsRepository.get(sessionId);

		if (!existingSession) return null;

		const shouldExtendSession = existingSession.expiresAt.getTime() - Date.now() < FIFTEEN_DAYS_MS;

		if (shouldExtendSession) {
			existingSession.expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
			await this.sessionsRepository.create({ ...existingSession });
			return { ...existingSession, fresh: true };
		}

		return { ...existingSession, fresh: false };
	}

	async invalidateSession(sessionId: string): Promise<void> {
		await this.sessionsRepository.delete(sessionId);
	}

	private generateSessionToken(): string {
		return generateId();
	}
}
