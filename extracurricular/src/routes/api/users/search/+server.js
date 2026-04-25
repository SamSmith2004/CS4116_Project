import { db } from '$lib/server/db';
import { user, userDetails, interests, matches } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import calculateAge from '$lib/utils/age.js';

const TAG = 'SearchAPI';

const DEFAULT_SORT = 'none';
const MIN_ALLOWED_AGE = 18;
const RESULT_LIMIT = 100;

function makeInvalidAgeError(message) {
	const error = new Error(message);
	error.name = 'InvalidAgeError';
	return error;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
	try {
		const sessionUserId = locals.user?.id;
		if (!sessionUserId) {
			return json({ users: [], total: 0 }, { status: 401 });
		}

		const filters = getSearchFilters(url);
		const ageSqlConvert = sql`date_part('year', age(current_date, ${user.dob}))`;
		const whereClauses = buildWhereClauses(sessionUserId, filters, ageSqlConvert);
		const sortType = getSortType(filters.sortBy, ageSqlConvert);

		const users = await fetchMatchingUsers(whereClauses, sortType);
		const interestsByUser = await fetchInterestsByUser(users.map((profile) => profile.id));
		const relationshipStatusByUser = await fetchRelationshipStatusByUser(
			sessionUserId,
			users.map((profile) => profile.id)
		);
		const userProfiles = users.map((profile) =>
			buildUserProfiles(profile, interestsByUser, relationshipStatusByUser)
		);

		return json({ users: userProfiles, total: userProfiles.length });
	} catch (error) {
		if (error?.name === 'InvalidAgeError') {
			return json({ users: [], total: 0, error: error.message }, { status: 400 });
		}
		console.error(`[${TAG}] search failed`, error);
		return json({ users: [], total: 0, error: 'Search failed' }, { status: 500 });
	}
}

function getSearchFilters(url) {
	const query = (url.searchParams.get('q') ?? '').trim();
	const university = (url.searchParams.get('university') ?? '').trim();
	const degree = (url.searchParams.get('degree') ?? '').trim();
	const interestsRaw = url.searchParams.get('interests');
	const minAge = parseAgeFilter(url.searchParams.get('minAge'));
	const maxAge = parseAgeFilter(url.searchParams.get('maxAge'));
	const sortBy = (url.searchParams.get('sort') ?? DEFAULT_SORT).trim();

	if (minAge !== null && maxAge !== null && minAge > maxAge) {
		throw makeInvalidAgeError('Min age cannot be greater than max age');
	}

	return {
		query,
		queryTerms: parseQueryTerms(query),
		university,
		degree,
		selectedInterests: parseCsv(interestsRaw),
		minAge,
		maxAge,
		sortBy
	};
}

function buildWhereClauses(sessionUserId, filters, ageSqlConvert) {
	const whereClauses = [
		ne(user.id, sessionUserId), // ingore logged user
		eq(user.isBanned, false)
	]; 

	for (const term of filters.queryTerms) {
		const like = `%${term}%`;
		whereClauses.push(or(ilike(user.name, like), ilike(user.fname, like), ilike(user.lname, like)));
	}

	if (filters.university) {
		whereClauses.push(eq(userDetails.university, filters.university));
	}

	if (filters.degree) {
		whereClauses.push(eq(userDetails.degree, filters.degree));
	}

	if (filters.minAge !== null) {
		whereClauses.push(sql`${ageSqlConvert} >= ${filters.minAge}`);
	}

	if (filters.maxAge !== null) {
		whereClauses.push(sql`${ageSqlConvert} <= ${filters.maxAge}`);
	}

	for (const selected of filters.selectedInterests) {
		whereClauses.push(sql`exists (
			select 1
			from interests i
			where i.user_id = ${user.id}
			and cast(i.interest as text) ilike ${`%${selected}%`}
		)`);
	}

	return whereClauses;
}

function getSortType(sortBy, ageSqlConvert) {
	switch (sortBy) {
		case 'account_age_desc':
			return [desc(user.createdAt), asc(user.name)];
		case 'user_age_asc':
			return [asc(ageSqlConvert), asc(user.name)];
		case 'none':
		default:
			return [];
	}
}

async function fetchMatchingUsers(whereClauses, sortType) {
	let query = db
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
			avatarUrl: userDetails.avatarUrl
		})
		.from(user)
		.leftJoin(userDetails, eq(user.id, userDetails.userId))
		.where(and(...whereClauses));

	if (sortType.length > 0) {
		query = query.orderBy(...sortType);
	}

	return query.limit(RESULT_LIMIT);
}

async function fetchInterestsByUser(userIds) {
	if (userIds.length === 0) {
		return {};
	}

	const interestRows = await db
		.select({ userId: interests.userId, interest: interests.interest })
		.from(interests)
		.where(inArray(interests.userId, userIds));

	return interestRows.reduce((acc, row) => {
		if (!acc[row.userId]) acc[row.userId] = [];
		if (row.interest) acc[row.userId].push(row.interest);
		return acc;
	}, {});
}

async function fetchRelationshipStatusByUser(sessionUserId, userIds) {
	if (!sessionUserId || userIds.length === 0) {
		return {};
	}

	const relationshipRows = await db
		.select({
			matcher: matches.matcher,
			matched: matches.matched,
			status: matches.status
		})
		.from(matches)
		.where(
			or(
				and(eq(matches.matcher, sessionUserId), inArray(matches.matched, userIds)),
				and(eq(matches.matched, sessionUserId), inArray(matches.matcher, userIds))
			)
		);

	return relationshipRows.reduce((acc, row) => {
		const otherUserId = row.matcher === sessionUserId ? row.matched : row.matcher;
		if (!acc[otherUserId] && row.status) {
			acc[otherUserId] = row.status;
		}
		return acc;
	}, {});
}

function buildUserProfiles(profile, interestsByUser, relationshipStatusByUser) {
	const first = profile.fname?.trim() ?? '';
	const last = profile.lname?.trim() ?? '';
	const full = `${first} ${last}`.trim();
	const displayName = full || profile.name?.trim() || profile.email?.split('@')[0] || 'Unknown User';
	const relationshipStatus = relationshipStatusByUser?.[profile.id];

	return {
		id: profile.id,
		name: displayName,
		age: calculateAge(profile.dob),
		university: profile.university,
		course: profile.degree,
		bio: profile.bio ?? 'No bio yet.',
		interests: interestsByUser[profile.id] ?? [],
		imageUrl: profile.avatarUrl,
		...(relationshipStatus ? { relationshipStatus } : {})
	};
}

function parseCsv(rawValue) {
	return (rawValue ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseQueryTerms(query) {
	return (query ?? '')
		.trim()
		.split(/\s+/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseAgeFilter(rawAge) {
	if (rawAge === null || rawAge === '') {
		return null;
	}

	const parsed = Number.parseInt(rawAge ?? '', 10);
	if (!Number.isInteger(parsed)) {
		throw makeInvalidAgeError('Age must be a whole number');
	}

	if (parsed < MIN_ALLOWED_AGE) {
		throw makeInvalidAgeError(`Age must be at least ${MIN_ALLOWED_AGE}`);
	}

	return parsed;
}