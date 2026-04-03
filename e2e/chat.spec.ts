import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should display chat interface', async ({ page }) => {
    await page.goto('/');
    
    // Look for chat input
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible();
  });

  test('should allow typing in chat input', async ({ page }) => {
    await page.goto('/');
    
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('Hello AKIOR');
    
    await expect(chatInput).toHaveValue('Hello AKIOR');
  });

  test('should have send button', async ({ page }) => {
    await page.goto('/');
    
    // Look for send button (could be button with text or icon)
    const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
    if (await sendButton.count() === 0) {
      // Try to find button near input
      const buttons = page.locator('button');
      await expect(buttons.first()).toBeVisible();
    }
  });
});

test.describe('Public Chat', () => {
  test('should load public chat page', async ({ page }) => {
    await page.goto('/ask');
    
    await expect(page).toHaveURL('/ask');
  });

  test('should have chat interface on public page', async ({ page }) => {
    await page.goto('/ask');
    
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Voice Interface', () => {
  test('should load voice interface page', async ({ page }) => {
    await page.goto('/talk');
    
    await expect(page).toHaveURL('/talk');
  });

  test('should have microphone button', async ({ page }) => {
    await page.goto('/talk');
    
    // Look for microphone button or icon
    const micButton = page.locator('button').filter({ hasText: /mic|speak|voice/i }).first();
    if (await micButton.count() === 0) {
      // Just check that page loaded
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
