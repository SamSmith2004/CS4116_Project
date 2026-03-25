import { db } from '$lib/server/db';
import { convos, messages as messagesTable, user, matches, userDetails } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

const UPLOADS_DIR = '/app/uploads'; 
// const UPLOADS_DIR = 'src/lib/assets/uploads'; // Dev

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, params }) => {
    const sessionUser = locals.user;
    if (!sessionUser) return {};

    const convoId = params.id;
    if (!convoId) return fail(400, { message: 'Conversation id is required' });

    const [convo] = await db.select().from(convos).where(eq(convos.id, convoId));
    if (!convo) return fail(404, { message: 'Conversation not found' });
    if (convo.user1 !== sessionUser.id && convo.user2 !== sessionUser.id) return fail(403, { message: 'Access denied' });

    const otherUserId = convo.user1 === sessionUser.id ? convo.user2 : convo.user1;

    const messages = await db.select({
        id: messagesTable.id,
        text: messagesTable.text,
        mediaUrl: messagesTable.mediaUrl,
        senderId: messagesTable.senderId,
        receiverId: messagesTable.receiverId,
        timestamp: messagesTable.timestamp
    }).from(messagesTable).where(eq(messagesTable.convoId, convoId)).orderBy(messagesTable.timestamp);

    const [otherUser] = await db.select({
        id: user.id,
        name: user.name,
        avatarUrl: userDetails.avatarUrl
    }).from(user).leftJoin(userDetails, eq(user.id, userDetails.userId)).where(eq(user.id, otherUserId));

    const [myDetails] = await db.select({
        id: user.id,
        avatarUrl: userDetails.avatarUrl
    }).from(user).leftJoin(userDetails, eq(user.id, userDetails.userId)).where(eq(user.id, sessionUser.id));

    return {
        convoId,
        me: myDetails,
        messages,
        otherUser
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    sendMessage: async ({ request, locals, params }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(400, { message: 'Invalid session' });

        const convoId = params?.id;
        if (!convoId) return fail(400, { message: 'Conversation id is required' });

        const form = await request.formData();
        const receiverId = form.get('receiverId')?.toString();
        const content = form.get('content')?.toString();
        const media = form.get('media');

        if (!receiverId) return fail(400, { message: 'Invalid recipient' });
        if (!content && !(media && media.size)) return fail(400, { message: 'Invalid message' });

        const [convo] = await db.select().from(convos).where(eq(convos.id, convoId));
        if (!convo) return fail(404, { message: 'Conversation not found' });
        if (convo.user1 !== sessionUser.id && convo.user2 !== sessionUser.id) return fail(403, { message: 'Access denied' });

        const matchesRows = await db
            .select()
            .from(matches)
            .where(
                or(
                    and(eq(matches.matcher, sessionUser.id), eq(matches.matched, receiverId)),
                    and(eq(matches.matcher, receiverId), eq(matches.matched, sessionUser.id))
                )
            );
        if (!matchesRows || matchesRows.length === 0) return fail(400, { message: 'You must be matched with this user to send a message' });

        try {
            let mediaUrl = null;
            if (media && media.size > 0) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(media.type)) {
                    return fail(400, { message: 'Invalid image type. Use JPEG, PNG and WebP.' });
                }

                const mimeToExt = {
                    'image/jpeg': 'jpg',
                    'image/png': 'png',
                    'image/webp': 'webp'
                };
                const safeExt = mimeToExt[media.type] || 'jpg';
                const filename = `${Date.now()}.${safeExt}`;
                const dir = path.join(UPLOADS_DIR, sessionUser.id.toString(), 'messages'); 
                await mkdir(dir, { recursive: true });
                const filePath = path.join(dir, filename);
                const buffer = Buffer.from(await media.arrayBuffer());
                await writeFile(filePath, buffer);
                mediaUrl = `/api/messages/${sessionUser.id}/${filename}`;
            }

            await db.insert(messagesTable).values({
                convoId,
                text: content || null, // null is to allow image only messages
                mediaUrl,
                senderId: sessionUser.id,
                receiverId
            });

            return { success: true, message: 'Message Sent' };
        } catch (e) {
            console.error('Sender msg error:', e);
            return fail(500, { message: 'Unexpected server error' });
        }
    }
};
