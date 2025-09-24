# Testing Guide for Tranquilae

## Overview

This project uses a comprehensive testing strategy with three levels of testing:

1. **Unit Tests** - Testing individual functions, components, and utilities
2. **Integration Tests** - Testing how different parts work together
3. **End-to-End (E2E) Tests** - Testing complete user flows

## Test Structure

```
📁 __tests__/
├── 📁 lib/               # Unit tests for utility functions
│   └── database.test.ts
├── 📁 api/               # Unit tests for API routes
│   └── workouts/
│       └── recommendations.test.ts
├── 📁 components/        # Unit tests for React components
│   └── WorkoutRecommendations.test.tsx
└── 📁 integration/       # Integration tests
    └── middleware.test.ts

📁 tests/
└── 📁 e2e/               # End-to-end tests
    ├── auth.spec.ts
    ├── workout-recommendations.spec.ts
    ├── global-setup.ts
    └── global-teardown.ts
```

## Test Technologies

- **Jest** - Unit and integration test runner
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end browser testing
- **Lighthouse CI** - Performance and accessibility testing

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run only unit tests (excluding integration)
npm run test:unit
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration
```

### End-to-End Tests
```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests with browser visible
npm run test:e2e:headed

# Run specific E2E test
npx playwright test auth.spec.ts
```

### All Tests
```bash
# Run all tests (unit, integration, and E2E)
npm run test:all
```

## Test Coverage Goals

- **Functions**: 70% minimum coverage
- **Lines**: 70% minimum coverage
- **Branches**: 70% minimum coverage
- **Statements**: 70% minimum coverage

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions, components, or modules in isolation.

#### Example: Testing a utility function
```typescript
import { formatDuration } from '../lib/utils'

describe('formatDuration', () => {
  it('should format minutes correctly', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(75)).toBe('1h 15m')
    expect(formatDuration(60)).toBe('1h')
  })
})
```

#### Example: Testing a React component
```typescript
import { render, screen } from '@testing-library/react'
import { WorkoutCard } from '../components/WorkoutCard'

describe('WorkoutCard', () => {
  it('should display workout information', () => {
    const workout = {
      title: 'Morning Workout',
      duration: 30,
      difficulty: 'beginner'
    }

    render(<WorkoutCard workout={workout} />)
    
    expect(screen.getByText('Morning Workout')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
  })
})
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

#### Example: Testing API integration
```typescript
import { middleware } from '../middleware'

describe('Middleware Integration', () => {
  it('should protect routes and redirect unauthenticated users', async () => {
    const request = createMockRequest('/dashboard')
    const response = await middleware(request)
    
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/auth/login')
  })
})
```

### End-to-End Tests

E2E tests verify complete user workflows in a real browser environment.

#### Example: Testing user authentication flow
```typescript
import { test, expect } from '@playwright/test'

test('user can sign in and access dashboard', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('text=Welcome back')).toBeVisible()
})
```

## Mocking

### API Mocking
```typescript
// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: mockData })
  })
)
```

### Component Mocking
```typescript
// Mock external dependencies
jest.mock('@/lib/supabaseClient', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))
```

### E2E API Mocking
```typescript
// Mock API responses in Playwright
await page.route('**/api/workouts/**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockData)
  })
})
```

## Test Data Management

### Test Fixtures
Create reusable test data in `__tests__/fixtures/`:

```typescript
// __tests__/fixtures/workouts.ts
export const mockWorkouts = [
  {
    id: 1,
    title: 'Morning Strength Training',
    difficulty: 'beginner',
    duration: 30
  }
]
```

### Database Seeding for E2E Tests
Use the global setup to seed test data:

```typescript
// tests/e2e/global-setup.ts
async function globalSetup() {
  // Seed database with test data
  await seedDatabase()
}
```

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline:

1. **Unit & Integration Tests** - Run on every PR and push
2. **E2E Tests** - Run on staging deployments
3. **Coverage Reports** - Generated and uploaded to coverage service
4. **Lighthouse Tests** - Run for performance regression detection

## Environment Variables for Testing

```bash
# Test environment variables
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

## Best Practices

### 1. Test Naming
- Use descriptive test names: `should display error when API fails`
- Group related tests with `describe` blocks
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Test Isolation
- Each test should be independent
- Clean up after tests (database, mocks, etc.)
- Use `beforeEach` and `afterEach` for setup/cleanup

### 3. Mock External Dependencies
- Mock API calls, database connections, external services
- Use real implementations only when testing integration points
- Keep mocks simple and focused

### 4. Test User Interactions
- Test happy path and error scenarios
- Test accessibility requirements
- Test responsive design

### 5. Performance Testing
- Set reasonable timeouts
- Use Playwright's built-in performance metrics
- Run Lighthouse audits in CI

## Debugging Tests

### Unit Tests
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npm test -- database.test.ts
```

### E2E Tests
```bash
# Run with debug mode
npx playwright test --debug

# Run with UI mode for debugging
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Test Maintenance

### Regular Tasks
1. Review and update test data fixtures
2. Clean up obsolete tests
3. Update E2E tests when UI changes
4. Monitor test execution times
5. Update coverage thresholds as codebase grows

### When to Update Tests
- New features require new tests
- Bug fixes should include regression tests
- API changes require test updates
- UI changes require E2E test updates

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout values or optimize slow operations
2. **Flaky E2E tests**: Add proper waits and use stable selectors
3. **Mock issues**: Ensure mocks are reset between tests
4. **Coverage issues**: Add tests for uncovered code paths

### Getting Help
- Check test output for specific error messages
- Use `--verbose` flag for detailed test output
- Review CI logs for failures
- Check browser developer tools for E2E test issues

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
