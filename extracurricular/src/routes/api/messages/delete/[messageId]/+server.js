import { db } from '$lib/server/db';
import { messages as messagesTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import path from 'path';
import { rm } from 'fs/promises';

const UPLOADS_DIR = '/app/uploads';
// const UPLOADS_DIR = 'src/lib/assets/uploads'; // Dev

const TAG = 'MessagesAPI: ';

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
    const { messageId } = params;

    const sessionUser = locals?.user;
    if (!sessionUser) throw error(401, 'Not authenticated');

    try {
        const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, messageId));
        if (!msg) throw error(404, 'Message not found');
        if (msg.senderId !== sessionUser.id) throw error(403, 'Not allowed to delete this message');

        if (msg.mediaUrl) {
            try {
                const parts = msg.mediaUrl.split('/').filter(Boolean);

                // Have to rebuild url because db holds api location rather than filesystem location
                if (parts.length >= 4 && parts[0] === 'api' && parts[1] === 'messages') {
                    const userId = parts[2];
                    const filename = parts.slice(3).join('/');
                    const filePath = path.join(UPLOADS_DIR, userId, 'messages', filename);

                    await rm(filePath);
                }
            } catch (e) {
                console.log(TAG, 'Failed deleting media for message', e);
                throw e;
            }
        }

        await db.delete(messagesTable).where(eq(messagesTable.id, messageId));

        return json({ success: true });
    } catch (e) {
        console.error(TAG, e);
        throw error(500, 'Failed to delete message');
    }
}
