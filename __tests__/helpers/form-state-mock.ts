import { vi } from 'vitest'

interface FormState {
  error?: string | null
  success?: boolean
  data?: unknown
}

interface FormStatus {
  pending: boolean
}

type FormAction = (state: FormState, formData: FormData) => Promise<FormState>

export const formMocks = {
  useFormState: vi.fn((action: FormAction) => [null as FormState | null, action]),
  useFormStatus: vi.fn((): FormStatus => ({ pending: false })),
  useFormAction: vi.fn(() => vi.fn())
}

export function mockFormPending(isPending: boolean): void {
  formMocks.useFormStatus.mockReturnValue({ pending: isPending })
}

export function mockFormError(error: string | null): void {
  formMocks.useFormState.mockReturnValue([{ error } as FormState, vi.fn()])
}

export function mockFormSuccess(data: unknown = null): void {
  formMocks.useFormState.mockReturnValue([{ success: true, data } as FormState, vi.fn()])
}

export const resetFormMocks = () => {
  formMocks.useFormState.mockReset()
  formMocks.useFormStatus.mockReset()
  formMocks.useFormAction.mockReset()
  
  formMocks.useFormState.mockImplementation((action, initialState) => [initialState, vi.fn()])
  formMocks.useFormStatus.mockReturnValue({ pending: false, data: null, method: 'GET' })
  formMocks.useFormAction.mockReturnValue(vi.fn())
}