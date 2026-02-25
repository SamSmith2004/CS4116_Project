<script>
    import { enhance } from '$app/forms';

    let { form } = $props();
    let isRegistering = $state(false);
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
                <span class="material-symbols-rounded text-white text-[32px]">people</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Extracurricular</h1>
            <p class="text-gray-500 text-sm mt-1">Connect with people who share your interests</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

            <div class="flex rounded-xl bg-gray-100 p-1 mb-6">
                <button
                    type="button"
                    onclick={() => isRegistering = false}
                    class="flex-1 py-2 text-sm font-medium rounded-lg transition-all {!isRegistering ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                    Sign In
                </button>
                <button
                    type="button"
                    onclick={() => isRegistering = true}
                    class="flex-1 py-2 text-sm font-medium rounded-lg transition-all {isRegistering ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
                >
                    Register
                </button>
            </div>

            <form method="post" action={isRegistering ? '?/signUpEmail' : '?/signInEmail'} use:enhance class="space-y-4">

                {#if isRegistering}
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="name">
                            Full Name
                        </label>
                        <div class="relative">
                            <span class="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">person</span>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                            />
                        </div>
                    </div>
                {/if}

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
                            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                        />
                    </div>
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
                    {isRegistering ? 'Create Account' : 'Sign In'}
                </button>
            </form>
        </div>
    </div>
</div>
