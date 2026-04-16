import { db } from '$lib/server/db';
import {
    user,
    userDetails,
    interests,
    interestEnum,
    partnerPrefEnum,
    genderEnum,
    universityEnum,
    degreeEnum
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from '$lib/server/admin';

const UPLOADS_DIR = '/app/uploads/';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, params }) => {
    await requireAdmin(locals);

    const targetUserId = params.userId;

    const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId));
    if (!targetUser) {
        throw error(404, 'User not found');
    }

    const [details] = await db.select().from(userDetails).where(eq(userDetails.userId, targetUserId));
    const userInterests = await db.select().from(interests).where(eq(interests.userId, targetUserId));

    return {
        user: targetUser,
        details,
        userInterests: userInterests.map((i) => i.interest),
        allInterests: interestEnum.enumValues,
        allUniversities: universityEnum.enumValues,
        allDegrees: degreeEnum.enumValues,
        allPartnerPrefs: partnerPrefEnum.enumValues,
        allGenders: genderEnum.enumValues
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    updateProfile: async ({ request, locals, params }) => {
        await requireAdmin(locals);

        const targetUserId = params.userId;

        const [targetUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.id, targetUserId));

        if (!targetUser) {
            return fail(404, { message: 'User not found' });
        }

        const formData = await request.formData();

        const fname = formData.get('fname');
        const lname = formData.get('lname');
        const bio = formData.get('bio');
        const university = formData.get('university');
        const degree = formData.get('degree');
        const gender = formData.get('gender');
        const partnerPref = formData.get('partnerPref');
        const selectedInterests = formData.getAll('interests');

        /** @type {File | null} */
        const avatar = formData.get('avatar');

        let avatarUrl = undefined;

        if (avatar && avatar.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(avatar.type)) {
                return fail(400, { message: 'Invalid image type. Use JPEG, PNG and WebP.' });
            }

            const ext = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
            const filename = `${targetUserId}_${Date.now()}.${safeExt}`;
            const dir = path.join(UPLOADS_DIR, targetUserId.toString(), 'avatar');
            await rm(dir, { recursive: true, force: true });
            await mkdir(dir, { recursive: true });
            const filePath = path.join(dir, filename);
            const buffer = Buffer.from(await avatar.arrayBuffer());
            await writeFile(filePath, buffer);
            avatarUrl = `/api/avatars/${targetUserId}/${filename}`;
        }

        try {
            await db.transaction(async (tx) => {
                await tx.update(user).set({ fname, lname }).where(eq(user.id, targetUserId));

                const detailsData = {
                    userId: targetUserId,
                    university,
                    degree,
                    bio,
                    gender: gender || null,
                    partnerPref: partnerPref || null,
                    ...(avatarUrl && { avatarUrl })
                };

                await tx
                    .insert(userDetails)
                    .values(detailsData)
                    .onConflictDoUpdate({ target: userDetails.userId, set: detailsData });

                await tx.delete(interests).where(eq(interests.userId, targetUserId));
                if (selectedInterests.length > 0) {
                    await tx.insert(interests).values(
                        selectedInterests.map((i) => ({ userId: targetUserId, interest: i }))
                    );
                }
            });

            return { success: true, message: 'Profile updated successfully!' };
        } catch (e) {
            console.log('admin updateProfile() error: ' + e);
            return fail(500, { message: 'Something went wrong. Please try again.' });
        }
    }
};
