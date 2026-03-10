import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { userDetails, interests } from '$lib/server/db/schema';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
	const raw = event.cookies.get('signup_temp');
    if (!raw) {
        return redirect(302, '/login');
    }
    return {};
};

export const actions = {
    signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const fname = formData.get('fname');
		const lname = formData.get('lname');
		const uni = formData.get('uni');
		const degree = formData.get('degree');
		const gender = formData.get('gender');
		const partnerPref = formData.get('partnerPref');

		const raw = event.cookies.get('signup_temp');
		if (!raw) return redirect(302, '/login');
    	const { email, password, dob } = raw ? JSON.parse(raw) : {};
		event.cookies.delete('signup_temp', { path: '/login/register-details' });

		try {
			const res = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: `${fname} ${lname}`,
					fname,
					lname,
					dob,
					callbackURL: '/auth/verification-success'
				}
			});

			await db.transaction(async (tx) => {
				await tx.insert(userDetails).values({
					userId: res.user.id,
					university: uni,
					degree: degree,
					gender: gender,
					partnerPref: partnerPref
				});

				const selectedInterests = formData.getAll('interests');
				if (selectedInterests.length > 0) {
					await tx.insert(interests).values(
						selectedInterests.map((interest) => ({
							userId: res.user.id,
							interest: interest
						}))
					);
				}
			});
		} catch (error) {
			console.log(error)
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/profile');
    }
}