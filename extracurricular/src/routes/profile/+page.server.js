import { db } from '$lib/server/db';
import { user, userDetails, interests, interestEnum, partnerPrefEnum, genderEnum } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/** @type {import('./$types').EntryGenerator} */
export const config = {
    body: {
        maxSize: '100m'
    }
};

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
        allInterests: interestEnum.enumValues,
        allPartnerPrefs: partnerPrefEnum.enumValues,
        allGenders: genderEnum.enumValues
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
        const gender = formData.get('gender');
        const partnerPref = formData.get('partnerPref');
        const selectedInterests = formData.getAll('interests');

        /** @type {File|null} */
        const avatar = formData.get('avatar');

        let avatarUrl = undefined;

        if (avatar && avatar.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(avatar.type)) {
                return fail(400, { message: 'Invalid image type. Use JPEG, PNG and WebP.' });
            }

            const ext = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
            const filename = `avatar.${safeExt}`;
            const dir = path.join('src/lib/assets/avatars', sessionUser.id.toString());
            await mkdir(dir, { recursive: true });
            const filePath = path.join(dir, filename);
            const buffer = Buffer.from(await avatar.arrayBuffer());
            await writeFile(filePath, buffer);
            avatarUrl = `/api/avatars/${sessionUser.id}/${filename}`;
        }

        try {
            await db.transaction(async (tx) => {
                await tx.update(user).set({ fname, lname }).where(eq(user.id, sessionUser.id));

                const detailsData = {
                    userId: sessionUser.id,
                    university,
                    degree,
                    bio,
                    gender: gender || null,
                    partnerPref: partnerPref || null,
                    ...(avatarUrl && { avatarUrl })
                };
                await tx.insert(userDetails).values(detailsData)
                    .onConflictDoUpdate({ target: userDetails.userId, set: detailsData });

                await tx.delete(interests).where(eq(interests.userId, sessionUser.id));
                if (selectedInterests.length > 0) {
                    await tx.insert(interests).values(
                        selectedInterests.map(i => ({ userId: sessionUser.id, interest: i }))
                    );
                }
            });

            return { success: true, message: 'Profile updated successfully!' };
        } catch (e) {
            console.log('updateProfile() error: ' + e);
            return fail(500, { message: 'Something went wrong. Please try again.' });
        }
    }
};