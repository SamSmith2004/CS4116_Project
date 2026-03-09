import { db } from '$lib/server/db';
import { user, userDetails, interests, interestEnum } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    const sessionUser = locals.user;
    if (!sessionUser) return {};

    const [details] = await db.select().from(userDetails).where(eq(userDetails.userId, sessionUser.id));
    const userInterests = await db.select().from(interests).where(eq(interests.userId, sessionUser.id));

    return {
        user: sessionUser,
        details: details,
        userInterests: userInterests.map(i => i.interest),
        allInterests: interestEnum.enumValues 
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    updateProfile: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401);

        const formData = await request.formData();
        
        const fname = formData.get('fname');
        const lname = formData.get('lname');
        const bio = formData.get('bio');
        const university = formData.get('university');
        const degree = formData.get('degree');
        const selectedInterests = formData.getAll('interests');

        try {
            await db.update(user).set({ fname, lname }).where(eq(user.id, sessionUser.id));

            // user_details
            const detailsData = { userId: sessionUser.id, university, degree, bio };
            await db.insert(userDetails).values(detailsData)
                .onConflictDoUpdate({ target: userDetails.userId, set: detailsData });

            // replace interests
            await db.delete(interests).where(eq(interests.userId, sessionUser.id));
            if (selectedInterests.length > 0) {
                await db.insert(interests).values(
                    selectedInterests.map(i => ({ userId: sessionUser.id, interest: i }))
                );
            }

            return { success: true };
        } catch (e) {
            return fail(500, { message: "Erreur serveur" });
        }
    }
};