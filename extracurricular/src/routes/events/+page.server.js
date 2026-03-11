import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';


/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {

    const allEvents = await db.select().from(events).orderBy(desc(events.date));

    return {
        user: locals.user, // All I want for christmas is isAdmin 
        events: allEvents
    }
};

/** @type {import('./$types').Actions} */
export const actions = {
    addEvent: async ({request, locals}) => {
        if (!locals.user || !locals.user.isAdmin) {
            return fail(400, {message: "Only Admins can craete events"});
        }

        const formData = await request.formData();
        const name = formData.get('name');
        const date = formData.get('date');
        const time = formData.get('time');
        const description = formData.get('desc');

        try {
            await db.insert(events).values({
                name,
                date,
                time,
                desc: description,
            });
            return {success: true};
        } catch(e){
            return fail(400, {message: "creating event failed..."});
        }


    }
}