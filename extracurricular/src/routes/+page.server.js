import { db } from '$lib/server/db';
import { user, userDetails, interests, universityEnum, degreeEnum, interestEnum } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import calculateAge from '$lib/utils/age.js';


function buildName(profile) {
    const first = profile.fname?.trim() ?? '';
    const last = profile.lname?.trim() ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (profile.name?.trim()) return profile.name.trim();
    return profile.email?.split('@')[0] ?? 'Unknown User';
}

const universityTintMap = {
    'University of Limerick': '#e6ffe6',
    'University College Cork': '#fff3e6',
    'NUI Galway': '#f2ecff',
    'University of Galway': '#f2ecff',
    'Dublin Institute of Technology': '#e6f4ff',
    'Maynooth University': '#f5f0ff',
    'Trinity College Dublin': '#e8f4ff'
};

export const load = async ({ locals }) => {
    const sessionUserId = locals.user?.id;

    const users = await db
        .select({
            id: user.id,
            name: user.name,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            dob: user.dob,
            image: user.image,
            university: userDetails.university,
            degree: userDetails.degree,
            bio: userDetails.bio,
            avatarUrl: userDetails.avatarUrl
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId));

    const userInterestsRows = await db
        .select({
            userId: interests.userId,
            interest: interests.interest
        })
        .from(interests);

    const interestsByUser = userInterestsRows.reduce((acc, row) => {
        if (!acc[row.userId]) acc[row.userId] = [];
        if (row.interest) acc[row.userId].push(row.interest);
        return acc;
    }, {});

    const recommendations = users
        .filter((profile) => profile.id !== sessionUserId)
        .map((profile) => ({
            id: profile.id,
            name: buildName(profile),
            age: calculateAge(profile.dob),
            university: profile.university,
            course: profile.degree,
            bio: profile.bio ?? 'No bio yet.',
            interests: interestsByUser[profile.id] ?? [],
            imageUrl: profile.avatarUrl
        }));

    const universityList = universityEnum.enumValues;
    const interestList = interestEnum.enumValues;
    const degreeList = degreeEnum.enumValues;

    return {
        requests: [],
        recommendations,
        universityTintMap,
        universityList,
        interestList,
        degreeList
    };
};
