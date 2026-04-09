
import { db } from '$lib/server/db';
import { reports, messages as messagesTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

const TAG = 'MessageAPI';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
    const { messageId } = params;

    const sessionUser = locals?.user;
    if (!sessionUser) throw error(401, 'Not authenticated');

    try {
        const body = await request.json();
        const reportedUserId = body.userId || body.reportedUserId;
        const reason = body.reason || null;

        if (!reportedUserId) throw error(400, 'reported userId is required');

        const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, messageId));
        if (!msg) throw error(404, 'Message not found');
        if (msg.senderId !== reportedUserId) {
            throw error(400, 'Reported user is not msg sender');
        }

        await db.insert(reports).values({ messageId, reportedUserId, reason });

        return json({ success: true });
    } catch (e) {
        console.error(TAG, e);
        throw error(500, 'Failed to report message');
    }
}