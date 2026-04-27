import { test, expect } from '@playwright/test';
import { signIn } from '../actions/SignIn.js';

test('admin landing: search, button visibility, and modal cancel paths', async ({ page }) => {
    const email = 'admin@gmail.com';
    const password = 'password';

    const targetReportedUser = 'Ilias Kourousis';
    const nonTargetReportedUser = 'Sarah Nolan';

    await signIn(page, email, password);
    await expect(page.getByText('Matching Process')).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Reported Users' })).toBeVisible();

    const reportedRows = page.locator('div.hidden.sm\\:flex');
    expect(await reportedRows.count()).toBeGreaterThanOrEqual(2);

    const searchInput = page.getByPlaceholder('Search reported users');

    await searchInput.fill('Ilias');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/admin\?q=Ilias/);
    await expect(reportedRows).toHaveCount(1);

    const iliasRow = page.locator('div.hidden.sm\\:flex', { hasText: targetReportedUser }).first();
    await expect(iliasRow).toBeVisible();
    await expect(iliasRow.getByRole('link', { name: 'View Messages' })).toBeVisible();
    await expect(iliasRow.getByRole('link', { name: 'Edit Profile' })).toBeVisible();
    await expect(iliasRow.getByRole('button', { name: 'Ban' })).toBeVisible();
    await expect(iliasRow.getByRole('button', { name: 'Delete Report(s)' })).toBeVisible();
    await expect(page.locator('div.hidden.sm\\:flex', { hasText: nonTargetReportedUser })).toHaveCount(0);

    await iliasRow.getByRole('button', { name: 'Ban' }).click();
    await expect(page.getByRole('heading', { name: 'Ban User?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Ban User?' })).toHaveCount(0);

    await iliasRow.getByRole('button', { name: 'Delete Report(s)' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Report(s)?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Report(s)?' })).toHaveCount(0);
});
