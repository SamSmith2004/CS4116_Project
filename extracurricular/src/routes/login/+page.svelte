<script>
    import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { showToast } from '$lib/toast.svelte.js';

    let { form } = $props();
    let emailInvalid = $state(false);

    function validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailInvalid = value.length > 0 && !emailRegex.test(value);
    }

	function handleSignInEnhance() {
		return async ({ result, update }) => {
			if (result.type === 'failure' && result.status === 403 && result.data?.banned) {
				showToast(result.data.message || 'Your account has been banned.', 'error');
			}

			await update();
		};
	}
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4 lg:p-6">
    <div class="w-full max-w-[1500px] lg:grid lg:grid-cols-3 lg:items-center lg:gap-6">
        <div class="hidden lg:flex items-center justify-center">
            <img
                src="/images/stock1.jpg"
                alt="Students collaborating"
                class="w-[78%] h-[22rem] xl:h-[26rem] rounded-3xl shadow-lg object-cover"
            />
        </div>

        <div class="w-full max-w-md mx-auto">

        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
                <img src="/images/logo.png" alt="Extracurricular logo" class="w-8 h-8" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Extracurricular</h1>
            <p class="text-gray-500 text-sm mt-1">Connect with people who share your interests.</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <form method="post" action="?/signInEmail" use:enhance={handleSignInEnhance} class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="email">
                        Email Address
                    </label>
                    <div class="relative">
                        <span class="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">mail</span>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            oninput={(e) => validateEmail(e.target.value)}
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition
                                {emailInvalid 
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}"
                        />
                    </div>
                    {#if emailInvalid}
                        <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <span class="material-symbols-rounded text-[14px]">error</span>
                            Please enter a valid email address
                        </p>
                    {/if}
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1" for="password">
                        Password
                    </label>
                    <div class="relative">
                        <span class="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                        />
                    </div>
                </div>

                {#if form?.message}
                    <div class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                        <span class="material-symbols-rounded text-red-500 text-[18px]">error</span>
                        <p class="text-sm text-red-600">{form.message}</p>
                    </div>
                {/if}

                <button
                    type="submit"
                    class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm mt-2"
                >
                    Sign In
                </button>

                <button
                    type="button"
                    onclick={goto('/login/register-details')}
                    class="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
                >
                    Create Account
                </button>
            </form>
        </div>
        </div>

        <div class="hidden lg:flex items-center justify-center">
            <img
                src="/images/stock2.jpg"
                alt="Campus social activity"
                class="w-[78%] h-[22rem] xl:h-[26rem] rounded-3xl shadow-lg object-cover"
            />
        </div>
    </div>
</div>
