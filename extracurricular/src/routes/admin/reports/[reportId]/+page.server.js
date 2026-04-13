import { db } from '$lib/server/db';
import { redirect, fail } from '@sveltejs/kit';
import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';
import { messages, reports } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin';
import { formatIsoDateTime } from '$lib/utils/date';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params }) {
    await requireAdmin(locals);

    const reportId = params.reportId;
    if (!reportId) {
        throw redirect(303, '/admin');
    }

    const [selectedReport] = await db
        .select({
            reportId: reports.id,
            reportedUserId: reports.reportedUserId,
            reportedUserName: user.name,
            reportedUserEmail: user.email
        })
        .from(reports)
        .leftJoin(user, eq(user.id, reports.reportedUserId))
        .where(eq(reports.id, reportId));

    if (!selectedReport) {
        throw redirect(303, '/admin');
    }

    const reportRows = await db
        .select({
            reportId: reports.id,
            messageId: reports.messageId,
            reason: reports.reason,
            reportedAt: reports.createdAt,
            messageText: messages.text,
            mediaUrl: messages.mediaUrl,
            senderId: messages.senderId,
            timestamp: messages.timestamp
        })
        .from(reports)
        .leftJoin(messages, eq(messages.id, reports.messageId))
        .where(
            and(
                eq(reports.reportedUserId, selectedReport.reportedUserId),
                isNotNull(reports.messageId)
            )
        )
        .orderBy(desc(reports.createdAt));

    const messagesById = new Map();
    for (const row of reportRows) {
        if (!row.messageId || messagesById.has(row.messageId)) {
            continue;
        }

        messagesById.set(row.messageId, {
            id: row.messageId,
            reportId: row.reportId,
            reason: row.reason || 'No reason provided',
            reportedAt: formatIsoDateTime(row.reportedAt),
            text: row.messageText || '',
            mediaUrl: row.mediaUrl,
            senderId: row.senderId,
            timestamp: formatIsoDateTime(row.timestamp)
        });
    }

    return {
        reportedUser: {
            id: selectedReport.reportedUserId,
            name: selectedReport.reportedUserName || 'Unknown User',
            email: selectedReport.reportedUserEmail || 'Unknown email'
        },
        reportedMessages: Array.from(messagesById.values())
    };
}

/** @type {import('./$types').Actions} */
export const actions = {
    deleteMessage: async ({ locals, request }) => {
        await requireAdmin(locals);

        const formData = await request.formData();
        const messageId = formData.get('messageId')?.toString();

        if (!messageId) {
            return fail(400, { message: 'Message id is required' });
        }

        try {
            await db.delete(messages).where(eq(messages.id, messageId));
            return { success: true };
        } catch (error) {
            console.error('Failed to delete reported message', error);
            return fail(500, { message: 'Failed to delete message' });
        }
    }
};
