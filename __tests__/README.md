# Testing Setup

This project uses a comprehensive testing setup with Vitest for unit/integration tests and Playwright for E2E tests.

## Test Structure

```
__tests__/
  e2e/              # End-to-end tests with Playwright
  helpers/          # Test helpers and utilities
  integration/      # Integration tests
  unit/             # Unit tests
```

## Running Tests

```bash
# Run all unit and integration tests
npm run test

# Watch mode for development
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Environment

- Uses `vitest.setup.ts` for global test setup
- Environment variables in `.env.test`
- Jest DOM matchers for DOM testing
- React Testing Library for component testing

## Writing Tests

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from '@/components/component-name'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { Feature } from '@/features/feature'

describe('Feature', () => {
  it('should integrate with other components', async () => {
    render(<Feature />)
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('user flow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Login')
  await expect(page.locator('h1')).toHaveText('Welcome')
})
```

## Best Practices

1. **Component Testing**
   - Test behavior, not implementation
   - Use semantic queries (getByRole, getByLabelText)
   - Test accessibility features
   - Mock external dependencies

2. **Integration Testing**
   - Focus on component interactions
   - Test data flow between components
   - Mock API calls and external services

3. **E2E Testing**
   - Test critical user flows
   - Use data-testid sparingly
   - Consider mobile viewports
   - Test error scenarios

4. **General Guidelines**
   - Keep tests focused and isolated
   - Use meaningful test descriptions
   - Clean up after each test
   - Avoid testing implementation details 