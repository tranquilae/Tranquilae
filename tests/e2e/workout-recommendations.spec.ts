import { test, expect } from '@playwright/test';

// Mock authenticated user session
test.use({
  storageState: 'tests/e2e/auth-state.json', // This would contain authenticated session
});

test.describe('Workout Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/workouts/recommendations**', async route => {
      const url = new URL(route.request().url());
      const searchParams = url.searchParams;
      
      const mockResponse = {
        success: true,
        data: {
          recommendations: [
            {
              id: 1,
              title: 'Morning Strength Training',
              description: 'Full body strength workout perfect for beginners',
              difficulty: 'beginner',
              category: 'strength',
              estimatedDuration: 30,
              equipmentNeeded: ['dumbbells'],
              exerciseCount: 8,
              exerciseCategories: ['chest', 'back', 'legs'],
              recommendationScore: 85,
              reasons: ['Matches your fitness level', 'Perfect duration for your schedule'],
            },
            {
              id: 2,
              title: 'HIIT Cardio Blast',
              description: 'High-intensity interval training session',
              difficulty: 'intermediate',
              category: 'cardio',
              estimatedDuration: 25,
              equipmentNeeded: [],
              exerciseCount: 6,
              exerciseCategories: ['cardio'],
              recommendationScore: 78,
              reasons: ['Great for cardiovascular health', 'No equipment needed'],
            },
          ],
          context: {
            userFitnessLevel: 'beginner',
            preferredDuration: 30,
            weeklyProgress: {
              completed: 2,
              goal: 4,
              remaining: 2,
            },
            topCategories: ['strength', 'cardio'],
            hasHistory: true,
          },
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });
  });

  test('should display workout recommendations on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for recommendations to load
    await expect(page.locator('[data-testid="workout-recommendations"]')).toBeVisible();
    
    // Check that recommendations are displayed
    await expect(page.locator('text=Morning Strength Training')).toBeVisible();
    await expect(page.locator('text=HIIT Cardio Blast')).toBeVisible();
    
    // Check workout details
    await expect(page.locator('text=30 min')).toBeVisible();
    await expect(page.locator('text=8 exercises')).toBeVisible();
    await expect(page.locator('text=Beginner')).toBeVisible();
    await expect(page.locator('text=Equipment: dumbbells')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Delay the API response to see loading state
    await page.route('**/api/workouts/recommendations**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Should show loading indicators
    await expect(page.locator('text=Loading recommendations...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Should show skeleton loaders
    await expect(page.locator('.animate-pulse')).toBeVisible();
  });

  test('should handle error state gracefully', async ({ page }) => {
    await page.route('**/api/workouts/recommendations**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal server error' },
        }),
      });
    });

    await page.goto('/dashboard');

    await expect(page.locator('text=Unable to Load Recommendations')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
  });

  test('should allow refreshing recommendations', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=Morning Strength Training')).toBeVisible();

    // Click refresh button
    await page.click('[data-testid="refresh-recommendations"]');

    // Should show refreshing state
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should navigate to workout when clicked', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=Morning Strength Training')).toBeVisible();

    // Click on workout card
    await page.click('[data-testid="workout-card-1"]');

    // Should navigate to workout page
    await expect(page).toHaveURL('/dashboard/workouts/1');
  });

  test('should display workout context information', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show weekly progress
    await expect(page.locator('text=2 more workouts to reach your weekly goal')).toBeVisible();
    
    // Should show recommendation reasons
    await expect(page.locator('text=Matches your fitness level')).toBeVisible();
    await expect(page.locator('text=Perfect duration for your schedule')).toBeVisible();
  });

  test('should filter recommendations', async ({ page }) => {
    await page.goto('/dashboard');

    // Test difficulty filter
    await page.selectOption('[data-testid="difficulty-filter"]', 'intermediate');
    
    // Should update recommendations based on filter
    await expect(page.locator('text=HIIT Cardio Blast')).toBeVisible();

    // Test category filter
    await page.selectOption('[data-testid="category-filter"]', 'cardio');
    
    // Should show only cardio workouts
    await expect(page.locator('text=HIIT Cardio Blast')).toBeVisible();
  });

  test('should show different content for new users', async ({ page }) => {
    await page.route('**/api/workouts/recommendations**', async route => {
      const mockResponse = {
        success: true,
        data: {
          recommendations: [],
          context: {
            userFitnessLevel: 'beginner',
            preferredDuration: 30,
            weeklyProgress: { completed: 0, goal: 4, remaining: 4 },
            topCategories: [],
            hasHistory: false,
          },
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    await page.goto('/dashboard');

    // Should show different messaging for new users
    await expect(page.locator('text=Start Your Fitness Journey')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');

    await expect(page.locator('[data-testid="workout-recommendations"]')).toBeVisible();
    
    // Should show mobile-optimized layout
    const recommendationCards = page.locator('[data-testid^="workout-card-"]');
    await expect(recommendationCards.first()).toBeVisible();
    
    // Cards should stack vertically on mobile
    const firstCard = recommendationCards.first();
    const secondCard = recommendationCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // Second card should be below first card on mobile
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y! + firstCardBox?.height!);
  });

  test('should show achievement notifications when goals are met', async ({ page }) => {
    await page.route('**/api/workouts/recommendations**', async route => {
      const mockResponse = {
        success: true,
        data: {
          recommendations: [],
          context: {
            userFitnessLevel: 'beginner',
            preferredDuration: 30,
            weeklyProgress: { completed: 4, goal: 4, remaining: 0 },
            topCategories: ['strength'],
            hasHistory: true,
          },
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    await page.goto('/dashboard');

    // Should show achievement message
    await expect(page.locator('text=You\'ve achieved your weekly workout goal!')).toBeVisible();
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for proper heading structure
    const mainHeading = page.locator('h2').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toHaveText('Recommended for You');

    // Check for alt text on images
    const workoutImages = page.locator('[data-testid^="workout-card-"] img');
    if (await workoutImages.count() > 0) {
      await expect(workoutImages.first()).toHaveAttribute('alt');
    }

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for ARIA labels where appropriate
    const refreshButton = page.locator('[data-testid="refresh-recommendations"]');
    await expect(refreshButton).toHaveAttribute('aria-label');
  });
});
