import { db } from '$lib/server/db';
import {
    userDetails,
    interests,
    interestEnum,
    partnerPrefEnum,
    genderEnum,
    universityEnum,
    degreeEnum
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    const sessionUser = locals.user;
    if (!sessionUser) return {};

    const [details] = await db.select().from(userDetails).where(eq(userDetails.userId, sessionUser.id));
    const userInterests = await db.select().from(interests).where(eq(interests.userId, sessionUser.id));

    return {
        user: sessionUser,
        details,
        userInterests: userInterests.map((i) => i.interest),
        allInterests: interestEnum.enumValues,
        allUniversities: universityEnum.enumValues,
        allDegrees: degreeEnum.enumValues,
        allPartnerPrefs: partnerPrefEnum.enumValues,
        allGenders: genderEnum.enumValues
    };
};