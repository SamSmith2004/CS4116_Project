import { fail, redirect } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { convos, matches } from '$lib/server/db/schema';
import { getMatchPageFeed } from '$lib/server/matching';
import { universityTintMap } from '$lib/server/university-tint-maps';

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
    startConversation: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401, { message: 'Invalid session' });

        const formData = await request.formData();
        const matchId = formData.get('matchId')?.toString();

        if (!matchId || matchId === sessionUser.id) {
            return fail(400, { message: 'Invalid conversation target.' });
        }

        const [matchedPair] = await db
            .select({ id: matches.id })
            .from(matches)
            .where(
                and(
                    or(
                        and(eq(matches.matcher, sessionUser.id), eq(matches.matched, matchId)),
                        and(eq(matches.matcher, matchId), eq(matches.matched, sessionUser.id))
                    ),
                    eq(matches.status, 'matched')
                )
            )
            .limit(1);

        if (!matchedPair) {
            return fail(403, { message: 'You can only message active matches.' });
        }

        const [existingConvo] = await db
            .select({ id: convos.id })
            .from(convos)
            .where(
                or(
                    and(eq(convos.user1, sessionUser.id), eq(convos.user2, matchId)),
                    and(eq(convos.user1, matchId), eq(convos.user2, sessionUser.id))
                )
            )
            .limit(1);

        if (existingConvo) {
            throw redirect(303, `/messaging/${existingConvo.id}`);
        }

        const [createdConvo] = await db
            .insert(convos)
            .values({
                user1: sessionUser.id,
                user2: matchId
            })
            .returning({ id: convos.id });

        throw redirect(303, `/messaging/${createdConvo.id}`);
    },
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
