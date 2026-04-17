import { fail } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import { getMatchPageFeed } from '$lib/server/matching';
import { universityTintMap } from '$lib/server/mock-matches';

export const load = async ({ locals }) => {
    const sessionUser = locals.user;
    if (!sessionUser) {
        return {
            requests: [],
            currentMatches: [],
            decisionHistory: [],
            universityTintMap
        };
    }

    const { requests, currentMatches, decisionHistory } = await getMatchPageFeed(sessionUser.id);

    return {
        requests,
        currentMatches,
        decisionHistory,
        universityTintMap
    };
};

export const actions = {
    decide: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401, { message: 'Invalid session' });

        const formData = await request.formData();
        const requestId = formData.get('requestId')?.toString();
        const decision = formData.get('decision')?.toString();

        if (!requestId || !['pass', 'fail'].includes(decision)) {
            return fail(400, { message: 'Invalid decision payload.' });
        }

        const nextStatus = decision === 'pass' ? 'matched' : 'unmatched';

        const updatedRows = await db
            .update(matches)
            .set({ status: nextStatus })
            .where(and(eq(matches.matcher, requestId), eq(matches.matched, sessionUser.id), eq(matches.status, 'pending')))
            .returning({ id: matches.id });

        if (updatedRows.length === 0) {
            return fail(404, { message: 'Profile no longer available.' });
        }

        return { success: true };
    },
    unmatch: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401, { message: 'Invalid session' });

        const formData = await request.formData();
        const matchId = formData.get('matchId')?.toString();

        if (!matchId) {
            return fail(400, { message: 'Invalid unmatch payload.' });
        }

        const updatedRows = await db
            .update(matches)
            .set({ status: 'unmatched' })
            .where(
                and(
                    or(
                        and(eq(matches.matcher, sessionUser.id), eq(matches.matched, matchId)),
                        and(eq(matches.matcher, matchId), eq(matches.matched, sessionUser.id))
                    ),
                    eq(matches.status, 'matched')
                )
            )
            .returning({ id: matches.id });

        if (updatedRows.length === 0) {
            return fail(404, { message: 'Match not found.' });
        }

        return { success: true };
    }
};
