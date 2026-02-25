import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { redirect } from "@sveltejs/kit";

/** @type {import('@sveltejs/kit').Handle} */ const handleBetterAuth = async ({
	event,
	resolve
}) => {
	const PUBLIC_ROUTES = ["/login"];
	const session = await auth.api.getSession({ headers: event.request.headers });

	const isPublicRoute = PUBLIC_ROUTES.some(route => 
        event.url.pathname.startsWith(route)
    );

    if (!session && !isPublicRoute) {
        redirect(303, "/login");
    }

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export /** @type {import('@sveltejs/kit').Handle} */ const handle = handleBetterAuth;
