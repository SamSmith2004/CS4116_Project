
import { db } from '$lib/server/db';
import { reports, messages as messagesTable, user } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
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

        const [reportedUser] = await db
            .select({ id: user.id, isBanned: user.isBanned })
            .from(user)
            .where(eq(user.id, reportedUserId));
        if (!reportedUser) throw error(404, 'User not found');
        if (reportedUser.isBanned) throw error(400, 'User is already banned');

        const [existingMessageReport] = await db
            .select({ id: reports.id })
            .from(reports)
            .where(
                and(
                    eq(reports.reporterUserId, sessionUser.id),
                    eq(reports.messageId, messageId)
                )
            );
        if (existingMessageReport) throw error(409, 'You have already reported this message');

        await db.insert(reports).values({
            messageId,
            reportedUserId,
            reporterUserId: sessionUser.id,
            reason
        });

        return json({ success: true });
    } catch (e) {
        if (e?.status) throw e;
        console.error(TAG, e);
        throw error(500, 'Failed to report message');
    }
}