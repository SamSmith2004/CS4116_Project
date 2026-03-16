import { db } from '$lib/server/db';
import { messages as messagesTable, convos } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ locals, params }) => {
    const sessionUser = locals.user;
    if (!sessionUser) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const convoId = params.id;
    if (!convoId) return new Response(JSON.stringify({ error: 'Conversation id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const [convo] = await db.select().from(convos).where(eq(convos.id, convoId));
    if (!convo) return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    if (convo.user1 !== sessionUser.id && convo.user2 !== sessionUser.id) return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    const messages = await db.select({
        id: messagesTable.id,
        text: messagesTable.text,
        mediaUrl: messagesTable.mediaUrl,
        senderId: messagesTable.senderId,
        receiverId: messagesTable.receiverId,
        timestamp: messagesTable.timestamp
    }).from(messagesTable).where(eq(messagesTable.convoId, convoId)).orderBy(messagesTable.timestamp);

    return new Response(JSON.stringify({ messages }), { headers: { 'Content-Type': 'application/json' } });
};
