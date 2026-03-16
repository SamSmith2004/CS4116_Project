import { db } from '$lib/server/db';
import { convos, messages, user, userDetails } from '$lib/server/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export const load = async ({ locals }) => {
    const userId = locals.user?.id;
    if (!userId) return fail(400, { message: 'Inavlid userId'});

    const rows = await db.select().from(convos).where(
        or(eq(convos.user1, userId), eq(convos.user2, userId))
    );

    const conversations = await Promise.all(
        rows.map(async (c) => {
            const otherUserId = c.user1 === userId ? c.user2 : c.user1;

            const [other] = await db
                .select({ id: user.id, name: user.name, avatarUrl: userDetails.avatarUrl })
                .from(user)
                .leftJoin(userDetails, eq(user.id, userDetails.userId))
                .where(eq(user.id, otherUserId));

            const [lastMsg] = await db
                .select({ text: messages.text, timestamp: messages.timestamp })
                .from(messages)
                .where(eq(messages.convoId, c.id))
                .orderBy(desc(messages.timestamp))
                .limit(1);

            return {
                id: c.id,
                otherUser: other || { id: otherUserId, name: 'Unknown' },
                lastMessage: lastMsg?.text || 'Could not load message',
                timestamp: lastMsg?.timestamp || null
            };
        })
    );

    return { conversations, userId };
};
