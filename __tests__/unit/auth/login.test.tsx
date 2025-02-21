import { vi, describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form';
import { useFormStatus } from 'react-dom';

// Mock the login action
const mockLogin = vi.fn();
vi.mock('@/app/(auth)/actions/login', () => ({
  login: (formData: FormData) => mockLogin(Object.fromEntries(formData))
}));

interface FormStatusPending {
  pending: boolean;
  data: FormData;
  method: string;
  action: string | ((formData: FormData) => void | Promise<void>);
}

// Mock useFormStatus
vi.mock('react-dom', () => {
  const actual = vi.importActual('react-dom');
  return {
    ...actual,
    useFormStatus: vi.fn((): FormStatusPending => ({ 
      pending: false,
      data: new FormData(),
      method: 'POST',
      action: '/api/auth/login'
    })),
    useFormState: (fn: any) => [null, fn]
  };
});

describe('UserAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue({ success: true });
  });

  test('renders login form', () => {
    render(<UserAuthForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    render(<UserAuthForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('handles login error', async () => {
    mockLogin.mockResolvedValueOnce({ error: 'Invalid credentials' });
    render(<UserAuthForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'error@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
    });
  });

  test('disables form during submission', async () => {
    // Mock pending state
    vi.mocked(useFormStatus).mockReturnValue({ 
      pending: true,
      data: new FormData(),
      method: 'POST',
      action: '/api/auth/login'
    });
    
    render(<UserAuthForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent(/signing in\.\.\./i);
  });
}); 