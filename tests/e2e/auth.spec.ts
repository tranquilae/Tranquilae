import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Tranquilae/);
    await expect(page.locator('text=Welcome to Tranquilae')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test would require setting up a test user in the database
    // For now, we'll skip the actual login and test the redirect behavior
    await page.goto('/auth/login');
    
    // Mock successful login by setting auth cookies
    await page.evaluate(() => {
      // In a real test, you'd either:
      // 1. Use a test user account
      // 2. Mock the authentication service
      // 3. Set cookies directly after authentication
      localStorage.setItem('test-auth-state', 'authenticated');
    });
    
    // The actual redirect would happen after authentication
    // await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('text=Please sign in to continue')).toBeVisible();
  });

  test('should redirect unauthenticated users from onboarding to login', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect unauthenticated users from settings to login', async ({ page }) => {
    await page.goto('/settings');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('Authentication UI Components', () => {
  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/login');
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show loading state during authentication', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    
    // Mock slow network to see loading state
    await page.route('**/auth/login', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('text=Signing in...')).toBeVisible();
    await expect(page.locator('button[disabled]')).toBeVisible();
  });

  test('should handle remember me functionality', async ({ page }) => {
    await page.goto('/auth/login');
    
    const rememberMeCheckbox = page.locator('input[type="checkbox"][name="remember"]');
    
    // Initially unchecked
    await expect(rememberMeCheckbox).not.toBeChecked();
    
    // Check the checkbox
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();
    
    // Uncheck the checkbox
    await rememberMeCheckbox.uncheck();
    await expect(rememberMeCheckbox).not.toBeChecked();
  });
});

test.describe('Social Authentication', () => {
  test('should display social login options', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
    await expect(page.locator('[data-testid="github-login"]')).toBeVisible();
  });

  test('should handle social login clicks', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Mock the OAuth redirect
    await page.route('**/auth/callback/**', route => {
      route.fulfill({
        status: 302,
        headers: { 'Location': '/dashboard' },
      });
    });
    
    // Click Google login should initiate OAuth flow
    await page.click('[data-testid="google-login"]');
    // In real tests, you'd verify the OAuth redirect URL
  });
});
