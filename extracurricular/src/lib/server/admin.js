import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/auth.schema';

export async function requireAdmin(locals) {
    const sessionUser = locals.user;
    if (!sessionUser) {
        throw redirect(302, '/login');
    }

    const query = await db.select({ isAdmin: user.isAdmin })
        .from(user)
        .where(eq(user.id, sessionUser.id));

    if (!query[0]?.isAdmin) {
        throw redirect(303, '/');
    }

    return sessionUser;
}

export default requireAdmin;
