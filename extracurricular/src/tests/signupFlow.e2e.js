import { expect, test } from '@playwright/test';

test('signup flow', async ({ page }) => {
    const email = `${Date.now()}@example.com`;
    const password = `Password123`;
    const dob = '2000-01-01';
    const fname = 'Johnny';
    const lname = 'Test';

    await page.goto('/login');
    await Promise.all([
        page.waitForURL('**/login/register-details', { timeout: 5000 }),
        page.getByRole('button', { name: /create account/i }).click()
    ]);

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="dob"]', dob);
    await page.fill('input[name="fname"]', fname);
    await page.fill('input[name="lname"]', lname);

    await selectOptionAndAssert('select[name="uni"]', 'University College Dublin');
    await selectOptionAndAssert('select[name="degree"]', 'Computer Science');
    await selectOptionAndAssert('select[name="gender"]', 'other');
    await selectOptionAndAssert('select[name="partnerPref"]', 'both');

    const hikingBtn = page.getByRole('button', { name: 'Hiking' });
    await hikingBtn.click();
    await expect(hikingBtn).toHaveClass(/bg-blue-600|text-white/); // Option is selected
    await expect(page.locator('input[type="hidden"][name="interests"][value="Hiking"]')).toHaveCount(1);

    await Promise.all([
        page.waitForURL('**/profile/edit', { timeout: 10000 }),
        page.getByRole('button', { name: /create account/i }).click()
    ]);
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).toBeVisible();

    async function selectOptionAndAssert(selector, value) {
        const select = page.locator(selector);
        const options = select.locator('option:not([disabled])');
        const count = await options.count();
        if (count === 0) return null;
        await select.selectOption(value);
        const selectedValue = await select.evaluate((el) => el.value);
        expect(selectedValue).toBe(value);
        return value;
    }
});