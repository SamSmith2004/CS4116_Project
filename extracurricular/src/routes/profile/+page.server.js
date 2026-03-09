//execut only server side 
//imports
import { db } from '$lib/server/db';
import { user, userDetails } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/** @type {import('./$types').PageServerLoad} **/
//verify that the session is on locals.user
export const load = async ({ locals }) => {
    const sessionUser = locals.user;
    if (!sessionUser) return {};

    // Get existant info in user_details table
    const [details] = await db
        .select()
        .from(userDetails)
        .where(eq(userDetails.userId, sessionUser.id));

    return {
        user: sessionUser,
        details: details // return all details and data from db
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    updateProfile: async ({ request, locals }) => {
        const sessionUser = locals.user;
        if (!sessionUser) return fail(401);

        const formData = await request.formData(); //wait for update of avatar
        const avatarFile = formData.get('avatar');
        let avatarUrl = formData.get('existingAvatarUrl');

        // store the uploaded pic
        if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
            const uploadDir = path.join(process.cwd(), 'static', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
                const fileName = `avatar_${sessionUser.id}_${Date.now()}.${avatarFile.name.split('.').pop()}`;//unic file name
                const filePath = path.join(uploadDir, fileName);
                
                await writeFile(filePath, Buffer.from(await avatarFile.arrayBuffer())); //write on storage
                avatarUrl = `/uploads/${fileName}`;
            } catch (err) {
                console.error("Upload error:", err);
            }
        }

        // DataBase
        const fname = formData.get('fname');
        const lname = formData.get('lname');
        
        const updateData = {
            userId: sessionUser.id,
            university: formData.get('university'),
            degree: formData.get('degree'),
            bio: formData.get('interests'), // Interests
            gender: formData.get('gender'),
            partnerPref: formData.get('partnerPref'),
            avatarUrl: avatarUrl
        }; 

        try {
            //Update user details in DB
            await db.update(user)
                .set({ fname, lname })
                .where(eq(user.id, sessionUser.id));

            // Upsert = combines "update" and "insert" to either update or insert
            await db.insert(userDetails)
                .values(updateData)
                .onConflictDoUpdate({
                    target: userDetails.userId,
                    set: updateData
                }); //this is ourUpsert

            return { success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { message: "Failed to save profile" });
        }
    }
};