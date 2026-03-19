import { error } from '@sveltejs/kit';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
};

// const UPLOADS_DIR = 'src/lib/assets/uploads'; // dev
const UPLOADS_DIR = '/app/uploads'; 

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
    const { userId, filename } = params;

    if (userId.includes('..') || userId.includes('/') || userId.includes('\\')) {
        throw error(400, 'Invalid user ID');
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw error(400, 'Invalid filename');
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !MIME_TYPES[ext]) {
        throw error(400, 'Invalid file type');
    }

    const filePath = path.join(UPLOADS_DIR, userId, 'messages', filename);

    try {
        const file = await readFile(filePath);
        return new Response(file, {
            headers: {
                'Content-Type': MIME_TYPES[ext],
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch {
        throw error(404, 'Image not found');
    }
}