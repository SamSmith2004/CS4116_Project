import { test, expect } from '@playwright/test';
import { signIn } from './actions/SignIn.js';

test('edit profile', async ({ page }) => {
	const email = "johnnytest@test.com";
	const password = "Password123";

	await signIn(page, email, password);
    await expect(page.getByText('Matching Process')).toBeVisible();

    await page.goto("/profile")
	await expect(page.getByText('EDIT PROFILE')).toBeVisible();

	await page.fill('input[name="fname"]', 'Playwright');
	await page.fill('input[name="lname"]', 'Tester');

	await page.selectOption('select[name="university"]', { label: 'University College Cork' });
	await page.selectOption('select[name="degree"]', { label: 'History' });
	await page.selectOption('select[name="gender"]', { label: 'Female' });
	await page.selectOption('select[name="partnerPref"]', { label: 'Both' });

	await page.fill('textarea[name="bio"]', 'Automated test bio.');

	const movieSpan = page.locator('input[name="interests"][value="Movies"] + span');
	if (await movieSpan.count() > 0) {
		await movieSpan.click();
	} else {
		await page.locator('input[name="interests"][value="Movies"]').check({ force: true });
	}

	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle' }),
		page.click('button[form="profile-form"]')
	]);

	await expect(page.locator('input[name="fname"]')).toHaveValue('Playwright');
	await expect(page.locator('input[name="lname"]')).toHaveValue('Tester');

	const uniVal = await page.locator('select[name="university"]').inputValue();
	expect(uniVal).toBe('University College Cork');
	const degreeVal = await page.locator('select[name="degree"]').inputValue();
	expect(degreeVal).toBe('History');
	const genderVal = await page.locator('select[name="gender"]').inputValue();
	expect(genderVal).toBe('female');
	const prefVal = await page.locator('select[name="partnerPref"]').inputValue();
	expect(prefVal).toBe('both');

	await expect(page.locator('textarea[name="bio"]')).toHaveValue('Automated test bio.');
    await expect(page.locator('input[name="interests"][value="Movies"]')).toBeChecked();

	await revert();

	async function revert() {
		await page.fill('input[name="fname"]', 'Johnny');
		await page.fill('input[name="lname"]', 'Test');
		await page.fill('textarea[name="bio"]', '');
		
        await page.selectOption('select[name="university"]', { label: 'University of Limerick' });
        await page.selectOption('select[name="degree"]', { label: 'Computer Science' });
        await page.selectOption('select[name="gender"]', { label: 'Male' });
        await page.selectOption('select[name="partnerPref"]', { label: 'Male' });

		const movieInput = page.locator('input[name="interests"][value="Movies"]');
		if (await movieInput.count() > 0) await movieInput.evaluate((el) => { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); });

        await Promise.all([
		    page.waitForNavigation({ waitUntil: 'networkidle' }),
		    page.click('button[form="profile-form"]')
	    ]);

        await expect(page.locator('textarea[name="bio"]')).toHaveValue('');
	}
});