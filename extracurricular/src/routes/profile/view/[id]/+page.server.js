import { db } from '$lib/server/db';
import { user, userDetails, interests } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import calculateAge from '$lib/utils/age.js';

function buildDisplayName(profile) {
    const first = profile.fname?.trim() ?? '';
    const last = profile.lname?.trim() ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (profile.name?.trim()) return profile.name.trim();
    return profile.email?.split('@')[0] ?? 'Unknown User';
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, locals }) => {
    const sessionUser = locals.user;
    if (!sessionUser) {
        redirect(303, '/login');
    }

    const viewedUserId = params.id;
    if (!viewedUserId) {
        throw error(400, 'Invalid user id');
    }

    if (viewedUserId === sessionUser.id) {
        redirect(303, '/profile');
    }

    const [profile] = await db
        .select({
            id: user.id,
            name: user.name,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            dob: user.dob,
            university: userDetails.university,
            degree: userDetails.degree,
            bio: userDetails.bio,
            avatarUrl: userDetails.avatarUrl,
            gender: userDetails.gender,
            partnerPref: userDetails.partnerPref
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .where(eq(user.id, viewedUserId));

    if (!profile) {
        throw error(404, 'Profile not found');
    }

    const interestRows = await db
        .select({ interest: interests.interest })
        .from(interests)
        .where(eq(interests.userId, viewedUserId));

    return {
        profile: {
            id: profile.id,
            name: buildDisplayName(profile),
            age: calculateAge(profile.dob),
            university: profile.university,
            degree: profile.degree,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            gender: profile.gender,
            partnerPref: profile.partnerPref,
            interests: interestRows.map((row) => row.interest).filter(Boolean)
        }
    };
};