import { useSession } from '$lib/auth-client';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { user } from '$lib/server/db/auth.schema';
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
    const sessionUser = locals.user;
    if (!sessionUser) {
        redirect(302, "/login");
    }

    const query = await db.select({ isAdmin: user.isAdmin })
        .from(user)
        .where(eq(user.id, sessionUser.id));

    const isAdmin = query[0]?.isAdmin;
    if (!isAdmin) {
        redirect(303, "/");
    }

    return {};
}