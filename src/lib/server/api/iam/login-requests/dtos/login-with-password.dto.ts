import { z } from 'zod';

export const loginWithPasswordDto = z.object({
	email: z.string().email(),
	password: z.string().min(8)
});

export type LoginWithPasswordDto = z.infer<typeof loginWithPasswordDto>;
