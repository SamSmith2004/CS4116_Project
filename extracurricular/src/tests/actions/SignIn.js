
export async function signIn(page, email, password) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    await Promise.all([
        page.waitForURL('**/', { timeout: 5000 }),
        page.locator('form').getByRole('button', { name: 'Sign In' }).click()
    ]);
}