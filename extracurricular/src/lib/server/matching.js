import { eq, inArray, ne, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { interests, matches, user, userDetails } from '$lib/server/db/schema';

const DEFAULT_IMAGE_URL = '/images/logo.png';

function toAge(dob) {
    if (!dob) return '';

    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return '';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age >= 0 ? age : '';
}

function isPartnerPreferenceCompatible(preference, candidateGender) {
    if (!preference) return true;
    if (!candidateGender) return false;
    if (preference === 'both') return true;
    return preference === candidateGender;
}

function areUsersCompatible(currentDetails, candidateDetails) {
    return (
        isPartnerPreferenceCompatible(currentDetails?.partnerPref, candidateDetails?.gender) &&
        isPartnerPreferenceCompatible(candidateDetails?.partnerPref, currentDetails?.gender)
    );
}

function calculateSharedInterestScore(currentInterests, candidateInterests) {
    if (!currentInterests.size || !candidateInterests.size) return 0;

    let overlap = 0;
    for (const interest of currentInterests) {
        if (candidateInterests.has(interest)) overlap += 1;
    }

    return overlap;
}

function calculateColdStartScore(currentDetails, candidateDetails) {
    let score = 0;

    if (currentDetails?.university && candidateDetails?.university && currentDetails.university === candidateDetails.university) {
        score += 2;
    }

    if (currentDetails?.degree && candidateDetails?.degree && currentDetails.degree === candidateDetails.degree) {
        score += 1;
    }

    return score;
}

function toHomepageProfile(row, candidateInterests) {
    const profile = {
        id: row.user.id,
        name: row.user.name,
        age: toAge(row.user.dob),
        university: row.details?.university ?? 'Unknown university',
        course: row.details?.degree ?? 'Degree not specified',
        bio: row.details?.bio ?? 'No bio yet.',
        interests: candidateInterests,
        imageUrl: row.details?.avatarUrl ?? row.user.image ?? DEFAULT_IMAGE_URL
    };

    return profile;
}

async function getProfilesByIds(userIds) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

    if (uniqueUserIds.length === 0) {
        return new Map();
    }

    const profileRows = await db
        .select({
            user: {
                id: user.id,
                name: user.name,
                dob: user.dob,
                image: user.image,
                isBanned: user.isBanned,
                createdAt: user.createdAt
            },
            details: {
                university: userDetails.university,
                degree: userDetails.degree,
                bio: userDetails.bio,
                gender: userDetails.gender,
                partnerPref: userDetails.partnerPref,
                avatarUrl: userDetails.avatarUrl
            }
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .where(inArray(user.id, uniqueUserIds));

    const interestRows = await db.select().from(interests).where(inArray(interests.userId, uniqueUserIds));

    const interestsByUserId = new Map();
    for (const row of interestRows) {
        if (!row.interest) continue;
        const current = interestsByUserId.get(row.userId) ?? [];
        current.push(row.interest);
        interestsByUserId.set(row.userId, current);
    }

    const profileById = new Map();
    for (const row of profileRows) {
        profileById.set(row.user.id, {
            row,
            interests: interestsByUserId.get(row.user.id) ?? []
        });
    }

    return profileById;
}

export async function getHomepageMatchFeed(currentUserId, options = {}) {
    const limit = options.limit ?? 50;

    const [currentUserRow] = await db
        .select({
            user: {
                id: user.id,
                name: user.name,
                dob: user.dob,
                image: user.image,
                createdAt: user.createdAt
            },
            details: {
                university: userDetails.university,
                degree: userDetails.degree,
                bio: userDetails.bio,
                gender: userDetails.gender,
                partnerPref: userDetails.partnerPref,
                avatarUrl: userDetails.avatarUrl
            }
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .where(eq(user.id, currentUserId));

    if (!currentUserRow) {
        return { requests: [], recommendations: [] };
    }

    const currentUserInterestsRows = await db.select().from(interests).where(eq(interests.userId, currentUserId));
    const currentUserInterests = new Set(currentUserInterestsRows.map((item) => item.interest).filter(Boolean));

    const allCandidateRows = await db
        .select({
            user: {
                id: user.id,
                name: user.name,
                dob: user.dob,
                image: user.image,
                createdAt: user.createdAt
            },
            details: {
                university: userDetails.university,
                degree: userDetails.degree,
                bio: userDetails.bio,
                gender: userDetails.gender,
                partnerPref: userDetails.partnerPref,
                avatarUrl: userDetails.avatarUrl
            }
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .where(ne(user.id, currentUserId));

    const candidateIds = allCandidateRows.map((row) => row.user.id);
    const candidateProfilesById = await getProfilesByIds(candidateIds);

    const matchRows = await db
        .select()
        .from(matches)
        .where(or(eq(matches.matcher, currentUserId), eq(matches.matched, currentUserId)));

    const excludedUserIds = new Set();
    const incomingPendingUserIds = new Set();

    for (const row of matchRows) {
        const otherUserId = row.matcher === currentUserId ? row.matched : row.matcher;

        if (row.status === 'matched') {
            excludedUserIds.add(otherUserId);
            continue;
        }

        if (row.status === 'unmatched') {
            excludedUserIds.add(otherUserId);
            continue;
        }

        if (row.status === 'pending') {
            if (row.matched === currentUserId) {
                incomingPendingUserIds.add(row.matcher);
            }
            excludedUserIds.add(otherUserId);
        }
    }

    const requests = allCandidateRows
        .filter((row) => incomingPendingUserIds.has(row.user.id))
        .map((row) => toHomepageProfile(row, candidateProfilesById.get(row.user.id)?.interests ?? []));

    const recommendations = allCandidateRows
        .filter((row) => !incomingPendingUserIds.has(row.user.id))
        .filter((row) => !excludedUserIds.has(row.user.id))
        .filter((row) => areUsersCompatible(currentUserRow.details, row.details))
        .map((row) => {
            const candidateInterests = candidateProfilesById.get(row.user.id)?.interests ?? [];
            const candidateInterestSet = new Set(candidateInterests);

            const interestScore = calculateSharedInterestScore(currentUserInterests, candidateInterestSet);
            const fallbackScore = currentUserInterests.size === 0
                ? calculateColdStartScore(currentUserRow.details, row.details)
                : 0;

            return {
                profile: toHomepageProfile(row, candidateInterests),
                score: interestScore + fallbackScore,
                interestScore,
                fallbackScore,
                createdAt: row.user.createdAt?.getTime?.() ?? 0
            };
        })
        .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score;
            if (right.interestScore !== left.interestScore) return right.interestScore - left.interestScore;
            if (right.fallbackScore !== left.fallbackScore) return right.fallbackScore - left.fallbackScore;
            if (right.createdAt !== left.createdAt) return right.createdAt - left.createdAt;
            return left.profile.id.localeCompare(right.profile.id);
        })
        .slice(0, limit)
        .map((entry) => entry.profile);

    return { requests, recommendations };
}

export async function getMatchPageFeed(currentUserId) {
    const [currentUserRow] = await db
        .select({
            user: {
                id: user.id,
                name: user.name,
                dob: user.dob,
                image: user.image
            },
            details: {
                university: userDetails.university,
                degree: userDetails.degree,
                bio: userDetails.bio,
                avatarUrl: userDetails.avatarUrl
            }
        })
        .from(user)
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .where(eq(user.id, currentUserId));

    if (!currentUserRow) {
        return { requests: [], currentMatches: [], blocklist: [] };
    }

    const matchRows = await db
        .select()
        .from(matches)
        .where(or(eq(matches.matcher, currentUserId), eq(matches.matched, currentUserId)));

    const relevantUserIds = matchRows.map((row) => (row.matcher === currentUserId ? row.matched : row.matcher));
    const profilesById = await getProfilesByIds(relevantUserIds);

    const requests = matchRows
        .filter((row) => row.status === 'pending' && row.matched === currentUserId)
        .sort((left, right) => (right.updatedAt?.getTime?.() ?? 0) - (left.updatedAt?.getTime?.() ?? 0))
        .map((row) => {
            const sourceProfile = profilesById.get(row.matcher);
            if (!sourceProfile) return null;
            return toHomepageProfile(sourceProfile.row, sourceProfile.interests);
        })
        .filter(Boolean);

    const currentMatches = matchRows
        .filter((row) => row.status === 'matched')
        .sort((left, right) => (right.updatedAt?.getTime?.() ?? 0) - (left.updatedAt?.getTime?.() ?? 0))
        .map((row) => {
            const otherUserId = row.matcher === currentUserId ? row.matched : row.matcher;
            const sourceProfile = profilesById.get(otherUserId);
            if (!sourceProfile) return null;
            return toHomepageProfile(sourceProfile.row, sourceProfile.interests);
        })
        .filter(Boolean);

    const blocklist = matchRows
        .filter((row) => row.status === 'unmatched')
        .sort((left, right) => (right.updatedAt?.getTime?.() ?? 0) - (left.updatedAt?.getTime?.() ?? 0))
        .map((row) => {
            const otherUserId = row.matcher === currentUserId ? row.matched : row.matcher;
            const sourceProfile = profilesById.get(otherUserId);
            if (!sourceProfile) return null;

            const profile = toHomepageProfile(sourceProfile.row, sourceProfile.interests);
            const isBanned = Boolean(sourceProfile.row.user.isBanned);

            return {
                ...profile,
                blockStatus: isBanned ? 'banned' : 'blocked',
                canUnblock: !isBanned && row.matcher === currentUserId
            };
        })
        .filter(Boolean)
        .slice(0, 20);

    return { requests, currentMatches, blocklist };
}
