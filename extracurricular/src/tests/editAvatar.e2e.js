import { test, expect } from '@playwright/test';
import { signIn } from './actions/SignIn.js';

test('edit profile', async ({ page }) => {
    const email = "johnnytest@test.com";
    const password = "Password123";

    await signIn(page, email, password);
    await expect(page.getByText('Matching Process')).toBeVisible();

    await page.goto("/profile")
	await expect(page.getByText('EDIT PROFILE')).toBeVisible();
    
    // fetch image to upload from free source
    const res = await fetch('https://picsum.photos/400');
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await page.setInputFiles('input[name="avatar"]', {
        name: 'avatar.jpg',
        mimeType: 'image/jpeg',
        buffer
    });
    
    const fileSize = await page.$eval('input[name="avatar"]', el => el.files[0]?.size || 0);
    expect(fileSize).toBeGreaterThan(0);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
        page.click('button[form="profile-form"]')
    ]);

    await expect(page.locator('img[alt="Avatar"]')).toBeVisible();

});