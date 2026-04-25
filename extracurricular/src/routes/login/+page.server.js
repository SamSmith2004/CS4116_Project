import { fail, redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';
import { sql } from 'drizzle-orm';

export const load = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const normalizedEmail = email.trim().toLowerCase();

		const [bannedUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(sql`lower(${user.email}) = ${normalizedEmail} and ${user.isBanned} = true`)
			.limit(1);

		if (bannedUser) {
			return fail(403, { banned: true, message: 'Your account has been banned.' });
		}

		try {
			await auth.api.signInEmail({
				body: {
					email: normalizedEmail,
					password,
					callbackURL: '/auth/verification-success'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/');
	}
};