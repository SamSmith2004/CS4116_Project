import { fail, redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

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

		try {
			await auth.api.signInEmail({
				body: {
					email,
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
	},
	signUpInit: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email').toString();
		const password = formData.get('password').toString();
		const dob = formData.get('dob').toString();

		if (email === null || password === null || dob === null ) { 
			return fail(400, { message: 'All fields are required' });
		}
		if (!isAdult(dob)) { 
			return fail(400, { message: 'You must be 18 or older to register' });
		}

		event.cookies.set('signup_temp', JSON.stringify({ email, password, dob }), {
			path: '/login/register-details',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
			maxAge: 60 * 10 // 10m
		});
		
		return redirect(302, '/login/register-details');
	}
};

const isAdult = (dob) => {
	// TODO: implement
	return true;
}
