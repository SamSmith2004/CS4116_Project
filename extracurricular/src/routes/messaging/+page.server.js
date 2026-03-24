import { db } from '$lib/server/db';
import { convos, messages, user, userDetails } from '$lib/server/db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    const userId = locals.user?.id;
    if (!userId) return fail(400, { message: 'Invalid userId'});

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
                .select({ text: messages.text, timestamp: messages.timestamp, url : messages.mediaUrl })
                .from(messages)
                .where(eq(messages.convoId, c.id))
                .orderBy(desc(messages.timestamp))
                .limit(1);


            return {
                id: c.id,
                otherUser: other || { id: otherUserId, name: 'Unknown' },
                lastMessage: lastMsg?.text || (lastMsg.text === null && lastMsg.url !== null) ? 'attachment' : 'Could not load message',
                timestamp: lastMsg?.timestamp || null
            };
        })
    );

    // Latest convo at top
    conversations.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
    });

    return { conversations, userId };
};
