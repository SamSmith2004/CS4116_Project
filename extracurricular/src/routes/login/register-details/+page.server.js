import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { userDetails, interests, universityEnum, degreeEnum, interestEnum, banned } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
	return {
		allInterests: interestEnum.enumValues,
		allUniversities: universityEnum.enumValues,
		allDegrees: degreeEnum.enumValues
	};
};

export const actions = {
    signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');
		const dob = formData.get('dob');
		const fname = formData.get('fname');
		const lname = formData.get('lname');
		const uni = formData.get('uni');
		const degree = formData.get('degree');
		const gender = formData.get('gender');
		const partnerPref = formData.get('partnerPref');

		if (!email || !password || !confirmPassword || !dob || !fname || !lname || !uni || !degree || !gender || !partnerPref) {
			return fail(400, { message: 'All fields are required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		if (!isValidEmail(email)) {
			return fail(400, { message: 'Invalid email address' });
		}

		const normalizedEmail = normalizeEmail(email);

		try {
			const [blockedEmail] = await db
				.select({ id: banned.id })
				.from(banned)
				.where(sql`lower(${banned.email}) = ${normalizedEmail}`)
				.limit(1);

			if (blockedEmail) {
				return fail(403, { message: 'This email is banned and cannot register.' });
			}
		} catch (e) {
			return fail(500, { message: 'Unexpected error' });
		}

		if (!isAdult(dob)) {
			return fail(400, { message: 'You must be 18 or older to register' });
		}

		try {
			const res = await auth.api.signUpEmail({
				body: {
					email: normalizedEmail,
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

const isAdult = (dob) => {
	const birthDate = new Date(dob);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age >= 18;
};

const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const normalizeEmail = (email) => {
	return email.trim().toLowerCase();
};