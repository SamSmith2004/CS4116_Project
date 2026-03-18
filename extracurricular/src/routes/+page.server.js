import { recommendations, requests, universityTintMap } from '$lib/server/mock-matches';

export const load = async () => {
    return {
        requests,
        recommendations,
        universityTintMap
    };
};
