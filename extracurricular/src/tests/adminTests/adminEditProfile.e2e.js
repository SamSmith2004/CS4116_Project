import { test, expect } from '@playwright/test';
import { signIn } from '../actions/SignIn.js';

test('admin can edit and restore bio', async ({ page }) => {
    const email = 'admin@gmail.com';
    const password = 'password';
    const targetReportedUser = 'Ilias Kourousis';
    const updatedBio = 'admin test';

    await signIn(page, email, password);
    await expect(page.getByText('Matching Process')).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Reported Users' })).toBeVisible();

    const iliasRow = page.locator('div.hidden.sm\\:flex', { hasText: targetReportedUser }).first();
    await expect(iliasRow).toBeVisible();

    await iliasRow.getByRole('link', { name: 'Edit Profile' }).click();
    await expect(page).toHaveURL(/\/admin\/profile\//);
    await expect(page.getByRole('heading', { name: 'Admin Edit Profile' })).toBeVisible();

    const bioInput = page.locator('textarea[name="bio"]');
    const originalBio = await bioInput.inputValue();

    await bioInput.fill(updatedBio);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Edit Profile' })).toBeVisible();
    await expect(bioInput).toHaveValue(updatedBio);

    await bioInput.fill(originalBio);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Admin Edit Profile' })).toBeVisible();
    await expect(bioInput).toHaveValue(originalBio);
});
