import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET({ locals }) {
    try {
        const sessionUser = locals.user;
        if (!sessionUser) {
            return json({ isAdmin: false });
        }

        const rows = await db.select({ isAdmin: user.isAdmin })
            .from(user)
            .where(eq(user.id, sessionUser.id));

        const isAdmin = rows[0]?.isAdmin;
        return json({ isAdmin });
    } catch (err) {
        console.error('is-admin error', err);
        return json({ isAdmin: false }, { status: 500 });
    }
}
