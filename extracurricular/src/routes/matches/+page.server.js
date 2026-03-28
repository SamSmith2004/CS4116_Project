import { fail } from '@sveltejs/kit';

import {
    requests as seededRequests,
    recommendations as seededRecommendations,
    universityTintMap
} from '$lib/server/mock-matches';

let pendingRequests = seededRequests.map((profile) => ({ ...profile }));
let currentMatches = seededRecommendations.map((profile) => ({ ...profile }));
let decisionHistory = [];

export const load = async () => {
    return {
        requests: pendingRequests,
        currentMatches,
        decisionHistory,
        universityTintMap
    };
};

export const actions = {
    decide: async ({ request }) => {
        const formData = await request.formData();
        const requestId = Number(formData.get('requestId'));
        const decision = formData.get('decision')?.toString();

        if (!Number.isFinite(requestId) || !['pass', 'fail'].includes(decision)) {
            return fail(400, { message: 'Invalid decision payload.' });
        }

        const selectedIndex = pendingRequests.findIndex((profile) => profile.id === requestId);
        if (selectedIndex === -1) {
            return fail(404, { message: 'Profile no longer available.' });
        }

        const [selectedProfile] = pendingRequests.splice(selectedIndex, 1);

        decisionHistory = [
            {
                id: selectedProfile.id,
                name: selectedProfile.name,
                age: selectedProfile.age,
                course: selectedProfile.course,
                bio: selectedProfile.bio,
                imageUrl: selectedProfile.imageUrl,
                decision,
                source: 'matched-with-you'
            },
            ...decisionHistory
        ];

        if (decision === 'pass' && !currentMatches.some((profile) => profile.id === selectedProfile.id)) {
            currentMatches = [selectedProfile, ...currentMatches];
        }

        return { success: true };
    },
    unmatch: async ({ request }) => {
        const formData = await request.formData();
        const matchId = Number(formData.get('matchId'));

        if (!Number.isFinite(matchId)) {
            return fail(400, { message: 'Invalid unmatch payload.' });
        }

        const previousLength = currentMatches.length;
        currentMatches = currentMatches.filter((profile) => profile.id !== matchId);

        if (currentMatches.length === previousLength) {
            return fail(404, { message: 'Match not found.' });
        }

        return { success: true };
    }
};
