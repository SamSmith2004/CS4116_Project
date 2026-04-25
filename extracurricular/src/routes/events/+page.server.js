import { db } from '$lib/server/db';
import { eventRegistrations, events } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { and, desc, eq, sql } from 'drizzle-orm';

function parseEventStart(dateValue, timeValue) {
    if (!dateValue || !timeValue) return null;

    const datePart = typeof dateValue === 'string'
        ? dateValue
        : new Date(dateValue).toISOString().slice(0, 10);

    const timePart = String(timeValue).slice(0, 8);
    const startedAt = new Date(`${datePart}T${timePart}`);

    return Number.isNaN(startedAt.getTime()) ? null : startedAt;
}

function hasEventStarted(event) {
    const startedAt = parseEventStart(event.date, event.time);
    if (!startedAt) return false;
    return startedAt <= new Date();
}


/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
    const currentUserId = locals.user?.id;

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

    const attendeeRows = await db
        .select({
            eventId: eventRegistrations.eventId,
            attendeesCount: sql`count(*)::int`.as('attendeesCount')
        })
        .from(eventRegistrations)
        .groupBy(eventRegistrations.eventId);

    const attendeesMap = new Map(
        attendeeRows.map((row) => [row.eventId, Number(row.attendeesCount) || 0])
    );

    let registeredEventIds = new Set();
    if (currentUserId) {
        const registeredRows = await db
            .select({ eventId: eventRegistrations.eventId })
            .from(eventRegistrations)
            .where(eq(eventRegistrations.userId, currentUserId));

        registeredEventIds = new Set(registeredRows.map((row) => row.eventId));
    }

    const hydratedEvents = allEvents.map((event) => ({
        ...event,
        attendeesCount: attendeesMap.get(event.id) ?? 0,
        isRegistered: registeredEventIds.has(event.id)
    }));

    return {
        user: locals.user, // All I want for christmas is isAdmin 
        events: hydratedEvents
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
    },
    registerEvent: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { message: 'You must be logged in to register.' });
        }

        const formData = await request.formData();
        const eventId = formData.get('eventId')?.toString();

        if (!eventId) {
            return fail(400, { message: 'Event id is required.' });
        }

        const [event] = await db
            .select({
                id: events.id,
                date: events.date,
                time: events.time
            })
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!event) {
            return fail(404, { message: 'Event not found.' });
        }

        if (hasEventStarted(event)) {
            return fail(400, { message: 'Registration is closed after the event starts.' });
        }

        try {
            await db
                .insert(eventRegistrations)
                .values({
                    eventId,
                    userId: locals.user.id
                })
                .onConflictDoNothing({
                    target: [eventRegistrations.eventId, eventRegistrations.userId]
                });

            const [countRow] = await db
                .select({ attendeesCount: sql`count(*)::int`.as('attendeesCount') })
                .from(eventRegistrations)
                .where(eq(eventRegistrations.eventId, eventId));

            return {
                success: true,
                eventId,
                isRegistered: true,
                attendeesCount: Number(countRow?.attendeesCount) || 0
            };
        } catch (e) {
            return fail(500, { message: 'Failed to register for event.' });
        }
    },
    unregisterEvent: async ({ request, locals }) => {
        if (!locals.user) {
            return fail(401, { message: 'You must be logged in to unregister.' });
        }

        const formData = await request.formData();
        const eventId = formData.get('eventId')?.toString();

        if (!eventId) {
            return fail(400, { message: 'Event id is required.' });
        }

        const [event] = await db
            .select({
                id: events.id,
                date: events.date,
                time: events.time
            })
            .from(events)
            .where(eq(events.id, eventId))
            .limit(1);

        if (!event) {
            return fail(404, { message: 'Event not found.' });
        }

        if (hasEventStarted(event)) {
            return fail(400, { message: 'You can no longer unregister after the event starts.' });
        }

        try {
            await db
                .delete(eventRegistrations)
                .where(
                    and(
                        eq(eventRegistrations.eventId, eventId),
                        eq(eventRegistrations.userId, locals.user.id)
                    )
                );

            const [countRow] = await db
                .select({ attendeesCount: sql`count(*)::int`.as('attendeesCount') })
                .from(eventRegistrations)
                .where(eq(eventRegistrations.eventId, eventId));

            return {
                success: true,
                eventId,
                isRegistered: false,
                attendeesCount: Number(countRow?.attendeesCount) || 0
            };
        } catch (e) {
            return fail(500, { message: 'Failed to unregister from event.' });
        }
    }
}