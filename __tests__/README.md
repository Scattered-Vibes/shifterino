# Testing Structure

This project follows a comprehensive testing strategy with different types of tests organized by their scope and purpose.

## Directory Structure

```
__tests__/
├── unit/                 # Unit tests for isolated pieces of code
│   ├── hooks/           # Tests for custom hooks
│   └── utils/           # Tests for utility functions
├── integration/         # Integration tests
│   ├── api/            # API endpoint tests
│   └── database/       # Database integration tests
├── e2e/                # End-to-end tests
│   └── features/       # Feature-based E2E tests
├── helpers/            # Test helpers and utilities
├── mocks/              # Mock data and services
└── setup.ts           # Test setup configuration
```

## Test Types and Conventions

### Unit Tests
- Located in `unit/` or colocated with components
- Test isolated pieces of functionality
- Use `.test.ts` or `.test.tsx` extension
- Example: `Button.test.tsx` next to `Button.tsx`

### Integration Tests
- Located in `integration/`
- Test multiple units working together
- Focus on API endpoints and database operations
- Use `.test.ts` extension

### End-to-End Tests
- Located in `e2e/`
- Test complete user flows
- Use Playwright
- Use `.spec.ts` extension

### Helpers and Mocks
- Reusable test utilities in `helpers/`
- Mock data and services in `mocks/`
- Shared test setup in `setup.ts`

## Best Practices

1. **Component Tests**
   - Colocate with component files
   - Focus on component-specific behavior
   - Use React Testing Library

2. **Hook Tests**
   - Place in `unit/hooks/`
   - Test all possible states and effects
   - Use `renderHook` from React Testing Library

3. **API Tests**
   - Place in `integration/api/`
   - Test request/response cycles
   - Include error cases

4. **Database Tests**
   - Place in `integration/database/`
   - Test database operations
   - Use isolated test database

5. **E2E Tests**
   - Group by feature
   - Test critical user paths
   - Include mobile and desktop viewports

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Adding New Tests

1. Choose the appropriate test type and location
2. Follow the naming convention for that type
3. Import helpers and mocks as needed
4. Write descriptive test cases
5. Include error scenarios
6. Add to appropriate npm script if needed 