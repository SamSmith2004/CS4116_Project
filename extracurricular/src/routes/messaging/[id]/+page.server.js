export const load = async ({ locals, params, url }) => {
    return {
        userId: locals.user.id,
        convoId: params.id
    };
};
