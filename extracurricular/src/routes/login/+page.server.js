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
		if (!isValidEmail(email)) {
			return fail(400, { message: 'Invalid email address'});
		}
		if (!isAdult(dob)) { 
			return fail(400, { message: 'You must be 18 or older to register' });
		}

		event.cookies.set('signup_temp', JSON.stringify({ email, password, dob }), {
			path: '/login/register-details',
			httpOnly: true,
			sameSite: 'strict',
			secure: false, // INVESTING
			maxAge: 60 * 10 // 10m
		});
		
		return redirect(302, '/login/register-details');
	}
};

const isAdult = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--; 
    }
    return age >= 18;
}


const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}