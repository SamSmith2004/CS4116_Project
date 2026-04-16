import { db } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';
import { banned, reports, userDetails } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin';
import { formatIsoDate } from '$lib/utils/date';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    await requireAdmin(locals);

    const reportRows = await db
        .select({
            reportId: reports.id,
            reason: reports.reason,
            messageId: reports.messageId,
            reportedAt: reports.createdAt,
            reportedUserId: reports.reportedUserId,
            avatarUrl: userDetails.avatarUrl,
            name: user.name,
            email: user.email
        })
        .from(reports)
        .leftJoin(user, eq(user.id, reports.reportedUserId))
        .leftJoin(userDetails, eq(user.id, userDetails.userId))
        .orderBy(desc(reports.createdAt));

    const latestReportByUser = new Map();
    const hasMessageReportByUser = new Map();
    for (const row of reportRows) {
        const key = row.reportedUserId;

        if (!hasMessageReportByUser.has(key)) {
            hasMessageReportByUser.set(key, false);
        }
        if (row.messageId) {
            hasMessageReportByUser.set(key, true);
        }

        if (!latestReportByUser.has(key)) {
            latestReportByUser.set(key, row);
        }
    }

    const reported = Array.from(latestReportByUser.values()).map((row) => ({
        id: row.reportId,
        userId: row.reportedUserId,
        name: row.name || 'Unknown User',
        email: row.email,
        reason: row.reason || 'No reason provided',
        reportedAt: formatIsoDate(row.reportedAt),
        isMessageReport: hasMessageReportByUser.get(row.reportedUserId) ?? false,
        avatarUrl: row.avatarUrl || null,
        banned: false
    }));

    const bannedRows = await db
        .select({
            banId: banned.id,
            email: banned.email
        })
        .from(banned)

    const bannedUsers = bannedRows.map((row) => ({
        id: row.banId,
        email: row.email,
        banned: true
    }));

    return {
        reported,
        banned: bannedUsers
    };
}

/** @type {import('./$types').Actions} */
export const actions = {
    banUser: async ({ locals, request }) => {
        await requireAdmin(locals);

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();

        if (!userId) {
            return fail(400, { message: 'User id is required' });
        }

        const [existingUser] = await db
            .select({
                id: user.id,
                email: user.email
            })
            .from(user)
            .where(eq(user.id, userId));

        if (!existingUser?.email) {
            return fail(404, { message: 'User not found' });
        }

        try {
            await db.transaction(async (tx) => {
                await tx
                    .insert(banned)
                    .values({ email: existingUser.email })
                    .onConflictDoNothing();

                await tx.delete(user).where(eq(user.id, userId));
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to ban user', error);
            return fail(500, { message: 'Failed to ban user' });
        }
    }
};