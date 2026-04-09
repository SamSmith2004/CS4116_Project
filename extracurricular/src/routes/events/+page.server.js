import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';


/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    const allEvents = await db
        .select({
            id: events.id,
            name: events.name,
            desc: events.desc,
            url: events.url,
            imgUrl: events.imgUrl,
            date: sql`to_char(${events.date}, 'YYYY-MM-DD')`.as('date'),
            time: sql`to_char(${events.time}, 'HH24:MI')`.as('time'),
            endTime: sql`to_char(${events.end_time}, 'HH24:MI')`.as('endTime')
        })
        .from(events)
        .orderBy(desc(events.date));

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
        const endTime = formData.get('endTime');

        try {
            await db.insert(events).values({
                name,
                date,
                time,
                desc: description,
                end_time: endTime,
            });
            return {success: true};
        } catch(e){
            return fail(500, {message: "creating event failed..."});
        }
    },
    deleteEvent: async ({ request, locals}) => {
        if (!locals.user || !locals.user.isAdmin) {
            return fail(400, {message: "Only Admins can delete events"});
        }

        const formData = await request.formData();
        const id = formData.get('id');
        if(!id){return fail(400, {message: "No such ID"});}
        
        try{
            await db.delete(events).where(eq(events.id, id));
            return { success: true };
        }catch(e){
            return fail(500, {message : "failed to delete"});
        }
    }
}