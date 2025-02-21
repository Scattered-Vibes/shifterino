import { vi } from 'vitest';
import React from 'react';

// Form state types
interface FormState {
  error?: { message: string };
  data?: any;
  success?: boolean;
}

type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

// Create form state mocks
const mockUseFormState = vi.fn((action: FormAction, initialState: FormState = {}) => {
  const [state, setState] = React.useState(initialState);
  const dispatch = vi.fn(async (formData: FormData) => {
    console.log('[FormState] Dispatch called with:', Object.fromEntries(formData));
    try {
      const result = await action(state, formData);
      console.log('[FormState] Action result:', result);
      setState(result);
      return result;
    } catch (error) {
      console.error('[FormState] Action error:', error);
      if (error instanceof Error && error.message.startsWith('Redirect to')) {
        throw error;
      }
      const errorState = { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
      setState(errorState);
      return errorState;
    }
  });
  return [state, dispatch] as const;
});

const mockUseFormStatus = vi.fn(() => ({
  pending: false,
  data: null,
  method: 'POST',
  action: null,
}));

// Mock react-dom
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  console.log('[Setup] Mocking react-dom with form state hooks');
  return {
    ...actual,
    useFormState: mockUseFormState,
    useFormStatus: mockUseFormStatus,
  };
});

// Export form mocks
export const formMocks = {
  useFormState: mockUseFormState,
  useFormStatus: mockUseFormStatus,
  setPending: (pending: boolean = true) => {
    console.log('[FormMocks] Setting pending:', pending);
    mockUseFormStatus.mockReturnValue({
      pending,
      data: null,
      method: 'POST',
      action: null,
    });
  },
  setError: (error: string) => {
    console.log('[FormMocks] Setting error:', error);
    mockUseFormState.mockImplementation(() => [{ error: { message: error } }, vi.fn()] as const);
  },
  reset: () => {
    console.log('[FormMocks] Resetting mocks');
    mockUseFormState.mockReset();
    mockUseFormStatus.mockReset();
    mockUseFormState.mockImplementation((action: FormAction, initialState = {}) => [initialState, vi.fn()] as const);
    mockUseFormStatus.mockReturnValue({
      pending: false,
      data: null,
      method: 'POST',
      action: null,
    });
  },
}; 