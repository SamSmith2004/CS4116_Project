import { test, expect } from '@playwright/test';
import { signIn } from '../actions/SignIn.js';

test('admin can open reported messages view', async ({ page }) => {
    const email = 'admin@gmail.com';
    const password = 'password';
    const targetReportedUser = 'Ilias Kourousis';
    const targetReportedEmail = 'i.k.kourousis@gmail.com';
    const targetReportedMessage = "I'm watching you";

    await signIn(page, email, password);
    await expect(page.getByText('Matching Process')).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Reported Users' })).toBeVisible();

    const iliasRow = page.locator('div.hidden.sm\\:flex', { hasText: targetReportedUser }).first();
    await expect(iliasRow).toBeVisible();
    await expect(iliasRow.getByRole('link', { name: 'View Messages' })).toBeVisible();

    await iliasRow.getByRole('link', { name: 'View Messages' }).click();
    await expect(page).toHaveURL(/\/admin\/reports\//);
    await expect(page.getByRole('heading', { name: 'Reported Messages' })).toBeVisible();
    await expect(page.getByText(`User: ${targetReportedUser} (${targetReportedEmail})`)).toBeVisible();
    await expect(page.getByText(targetReportedMessage)).toBeVisible();
});
