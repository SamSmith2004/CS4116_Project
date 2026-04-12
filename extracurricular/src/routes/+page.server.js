import { fail } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';

import { db } from '$lib/server/db';
import { matches } from '$lib/server/db/schema';
import { universityTintMap } from '$lib/server/mock-matches';
import { getHomepageMatchFeed } from '$lib/server/matching';

export const load = async ({ locals }) => {
    const sessionUser = locals.user;

    if (!sessionUser) {
        return {
            requests: [],
            recommendations: [],
            universityTintMap
        };
    }

    const { requests, recommendations } = await getHomepageMatchFeed(sessionUser.id, { limit: 50 });

    return {
        requests,
        recommendations,
        universityTintMap
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
