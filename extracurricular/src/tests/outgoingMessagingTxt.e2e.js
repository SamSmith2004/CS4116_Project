import { test, expect } from '@playwright/test';
import { signIn } from './actions/SignIn.js';

test('messaging flow with existing Leo Test conversation', async ({ page }) => {
	const email = 'johnnytest@test.com';
	const password = 'Password123';

	await signIn(page, email, password);
	await expect(page.getByText('Matching Process')).toBeVisible();

	await page.goto('/messaging');
	await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

	const conversationLinks = page.locator('a[href^="/messaging/"]');
	await expect(conversationLinks.filter({ hasText: 'Sam Smith' }).first()).toBeVisible();
	await expect(conversationLinks.filter({ hasText: 'Leo Test' }).first()).toBeVisible();

	await page.getByPlaceholder('Filter conversations').fill('Leo Test');
	await page.getByPlaceholder('Filter conversations').press('Enter');
	await expect(page).toHaveURL(/\/messaging\?q=Leo%20Test/);
	await expect(conversationLinks.filter({ hasText: 'Sam Smith' })).toHaveCount(0);
	await expect(conversationLinks.filter({ hasText: 'Leo Test' })).toHaveCount(1);

	const leoConversation = conversationLinks.filter({ hasText: 'Leo Test' }).first();
	await expect(leoConversation).toBeVisible();
	await leoConversation.click();

	await expect(page.getByRole('heading', { name: 'Leo Test' })).toBeVisible();

	const messageText = `Playwright messaging test ${Date.now()}`;
	await page.locator('textarea[name="content"]').fill(messageText);
	await page.getByRole('button', { name: 'Send' }).click();

	await expect(page.getByText(messageText).last()).toBeVisible();

	const deleteMessageText = `Delete message test ${Date.now()}`;
	await page.locator('textarea[name="content"]').fill(deleteMessageText);
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText(deleteMessageText).last()).toBeVisible();

	const deleteMessageBubble = page.locator('div', { hasText: deleteMessageText }).last();
	await deleteMessageBubble.getByRole('button', { name: 'Delete message' }).click();

	const deleteModal = page
		.locator('div.fixed.inset-0')
		.filter({ has: page.getByRole('heading', { name: 'Confirm delete' }) });
	await expect(deleteModal).toBeVisible();
	await deleteModal.getByRole('button', { name: 'Delete', exact: true }).click();

	await expect(page.getByText(deleteMessageText)).toHaveCount(0);
});