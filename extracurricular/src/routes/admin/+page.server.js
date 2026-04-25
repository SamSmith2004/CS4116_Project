import { db } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';
import { reports, userDetails } from '$lib/server/db/schema';
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
            email: user.email,
            isBanned: user.isBanned
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
        banned: row.isBanned ?? false
    }));

    const bannedRows = await db
        .select({
            userId: user.id,
            email: user.email
        })
        .from(user)
        .where(eq(user.isBanned, true));

    const bannedUsers = bannedRows.map((row) => ({
        id: row.userId,
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
    deleteReports: async ({ locals, request }) => {
        await requireAdmin(locals);

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();

        if (!userId) {
            return fail(400, { message: 'Reported user id is required' });
        }

        try {
            await db.delete(reports).where(eq(reports.reportedUserId, userId));
            return { success: true };
        } catch (error) {
            console.error('Failed to delete reports', error);
            return fail(500, { message: 'Failed to delete reports' });
        }
    },

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
                isBanned: user.isBanned
            })
            .from(user)
            .where(eq(user.id, userId));

        if (!existingUser?.id) {
            return fail(404, { message: 'User not found' });
        }

        if (existingUser.isBanned) {
            return fail(400, { message: 'User is already banned' });
        }

        try {
            await db.transaction(async (tx) => {
                await tx.update(user).set({ isBanned: true }).where(eq(user.id, userId));
                await tx.delete(reports).where(eq(reports.reportedUserId, userId));
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to ban user', error);
            return fail(500, { message: 'Failed to ban user' });
        }
    },

    unbanUser: async ({ locals, request }) => {
        await requireAdmin(locals);

        const formData = await request.formData();
        const userId = formData.get('userId')?.toString();

        if (!userId) {
            return fail(400, { message: 'User id is required' });
        }

        const [existingUser] = await db
            .select({
                id: user.id,
                isBanned: user.isBanned
            })
            .from(user)
            .where(eq(user.id, userId));

        if (!existingUser?.id) {
            return fail(404, { message: 'User not found' });
        }

        if (!existingUser.isBanned) {
            return fail(400, { message: 'User is not banned' });
        }

        try {
            await db.update(user).set({ isBanned: false }).where(eq(user.id, userId));
            return { success: true };
        } catch (error) {
            console.error('Failed to unban user', error);
            return fail(500, { message: 'Failed to unban user' });
        }
    }
};