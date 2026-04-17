import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { user, userDetails, interests, matches, universityEnum, degreeEnum, interestEnum } from '$lib/server/db/schema';
import { and, eq, or } from 'drizzle-orm';
import calculateAge from '$lib/utils/age.js';

const UNIVERISTY_WEIGHT = 5;
const DEGREE_WEIGHT = 3;
const INTEREST_WEIGHT = 1;

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

function isOrientationAligned(partnerPref, otherGender) {
    if (partnerPref === 'both') return true;
    if (otherGender === 'other') return false;
    return partnerPref === otherGender;
}

function areUsersOrientationAligned(sessionProfile, candidateProfile) {
    if (!sessionProfile.partnerPref || !candidateProfile.gender) return false;

    return (
        isOrientationAligned(sessionProfile.partnerPref, candidateProfile.gender) &&
        isOrientationAligned(candidateProfile.partnerPref, sessionProfile.gender)
    );
}

function countCommonInterests(sessionInterests, candidateInterests) {
    return candidateInterests.reduce((count, interest) => {
        if (sessionInterests.has(interest)) return count + INTEREST_WEIGHT;
        return count;
    }, 0);
}

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
            avatarUrl: userDetails.avatarUrl,
            partnerPref: userDetails.partnerPref,
            gender: userDetails.gender
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId));

    const userInterestsRows = await db
        .select({
            userId: interests.userId,
            interest: interests.interest
        })
        .from(interests);

    const existingMatchRows = sessionUserId
        ? await db
            .select({
                matcher: matches.matcher,
                matched: matches.matched,
                status: matches.status
            })
            .from(matches)
            .where(
                or(
                    eq(matches.matcher, sessionUserId),
                    eq(matches.matched, sessionUserId)
                )
            )
        : [];

    const excludedUserIds = new Set(
        existingMatchRows.map((row) => (row.matcher === sessionUserId ? row.matched : row.matcher))
    );

    function hasMatchAlready(profileId) {
        return !excludedUserIds.has(profileId);
    }

    const interestsByUser = userInterestsRows.reduce((acc, row) => {
        if (!acc[row.userId]) acc[row.userId] = [];
        if (row.interest) acc[row.userId].push(row.interest);
        return acc;
    }, {});

    const sessionProfile = users.find((profile) => profile.id === sessionUserId);
    const sessionInterests = new Set(interestsByUser[sessionUserId] ?? []);

    const recommendations = users
        .filter((profile) => profile.id !== sessionUserId
            && hasMatchAlready(profile.id)
            && (areUsersOrientationAligned(sessionProfile, profile)))
        .map((profile) => {
            let score = 0;

            if (sessionProfile) {
                if (sessionProfile.degree === profile.degree) {
                    score += DEGREE_WEIGHT;
                }

                if (sessionProfile.university === profile.university) {
                    score += UNIVERISTY_WEIGHT;
                }

                const candidateInterests = interestsByUser[profile.id] ?? [];
                score += countCommonInterests(sessionInterests, candidateInterests);
            }

            return {
                id: profile.id,
                score,
                name: buildName(profile),
                age: calculateAge(profile.dob),
                university: profile.university,
                course: profile.degree,
                bio: profile.bio ?? 'No bio yet.',
                interests: interestsByUser[profile.id] ?? [],
                imageUrl: profile.avatarUrl
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

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

export const actions = {
    decide: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401, { message: 'You must be signed in.' });

        const formData = await request.formData();
        const targetUserId = formData.get('requestId')?.toString();
        const decision = formData.get('decision')?.toString();
        const group = formData.get('group')?.toString();

        if (!targetUserId || targetUserId === sessionUser.id) {
            return fail(400, { message: 'Invalid target user.' });
        }

        if (!['pass', 'fail'].includes(decision) || !['requests', 'recommendations'].includes(group)) {
            return fail(400, { message: 'Invalid decision payload.' });
        }

        const nextStatus = group === 'requests'
            ? decision === 'pass'
                ? 'matched'
                : 'unmatched'
            : decision === 'pass'
                ? 'pending'
                : 'unmatched';

        const matcherId = group === 'requests' ? targetUserId : sessionUser.id;
        const matchedId = group === 'requests' ? sessionUser.id : targetUserId;

        await db.transaction(async (tx) => {
            await tx
                .delete(matches)
                .where(
                    or(
                        and(eq(matches.matcher, sessionUser.id), eq(matches.matched, targetUserId)),
                        and(eq(matches.matcher, targetUserId), eq(matches.matched, sessionUser.id))
                    )
                );

            await tx.insert(matches).values({
                matcher: matcherId,
                matched: matchedId,
                status: nextStatus
            });
        });

        return { success: true };
    }
};
