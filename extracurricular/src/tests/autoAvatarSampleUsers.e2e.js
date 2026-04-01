import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signIn } from './actions/SignIn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleUsersPath = path.resolve(__dirname, '../../../sample_users.json');

const sampleUsers = JSON.parse(readFileSync(sampleUsersPath, 'utf8'));

async function fetchAvatarBuffer(seed) {
	const response = await fetch(`https://picsum.photos/seed/${encodeURIComponent(seed)}/400`);

	if (!response.ok) {
		throw new Error(`Failed to fetch avatar image for seed ${seed}: ${response.status}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

for (const user of sampleUsers) {
	test(`auto-assign avatar for ${user.email}`, async ({ page }) => {
		await signIn(page, user.email, user.password);
		await expect(page.getByText('Matching Process')).toBeVisible();

		await page.goto('/profile');
		await expect(page.getByText('EDIT PROFILE')).toBeVisible();

		const buffer = await fetchAvatarBuffer(user.email);
		await page.setInputFiles('input[name="avatar"]', {
			name: `${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_avatar.jpg`,
			mimeType: 'image/jpeg',
			buffer
		});

		const fileSize = await page.$eval('input[name="avatar"]', (el) => el.files[0]?.size || 0);
		expect(fileSize).toBeGreaterThan(0);

		await Promise.all([
			page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
			page.click('button[form="profile-form"]')
		]);

		await expect(page.locator('img[alt="Avatar"]')).toBeVisible();
	});
}
