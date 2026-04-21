import { db } from '$lib/server/db';
import { reports, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

const TAG = 'UserReportAPI';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
    const { userId } = params;

    const sessionUser = locals?.user;
    if (!sessionUser) throw error(401, 'Not authenticated');

    try {
        if (!userId) throw error(400, 'reported userId is required');

        const [reportedUser] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
        if (!reportedUser) throw error(404, 'User not found');

        const body = await request.json().catch(() => ({}));
        const reason = body.reason || null;

        await db.insert(reports).values({ messageId: null, reportedUserId: userId, reason });

        return json({ success: true });
    } catch (e) {
        console.error(TAG, e);
        throw error(500, 'Failed to report profile');
    }
}
