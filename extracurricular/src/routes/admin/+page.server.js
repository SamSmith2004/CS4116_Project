import { db } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';
import { banned, reports, userDetails } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';

function formatDate(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toISOString().slice(0, 10);
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    const sessionUser = locals.user;
    if (!sessionUser) {
        throw redirect(302, '/login');
    }

    const query = await db.select({ isAdmin: user.isAdmin })
        .from(user)
        .where(eq(user.id, sessionUser.id));

    const isAdmin = query[0]?.isAdmin;
    if (!isAdmin) {
        throw redirect(303, '/');
    }

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
        reportedAt: formatDate(row.reportedAt),
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