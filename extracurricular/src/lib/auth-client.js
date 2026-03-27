import { createAuthClient } from "better-auth/svelte"

export const authClient = createAuthClient({
    baseURL: 'https://extracurricular.site'
});
export const { signIn, signUp, useSession } = authClient;