export interface FormState<T> {
  data: Partial<T>;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormAction<T> = 
  | { type: 'SET_FIELD'; field: keyof T; value: unknown }
  | { type: 'SET_ERRORS'; errors: Record<keyof T, string[]> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET' };

// Form validation types
export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  value?: number | string | RegExp;
  validator?: (value: unknown) => boolean;
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule[];
};

// Form submission types
export interface SubmitOptions {
  resetOnSuccess?: boolean;
  redirectTo?: string;
  showSuccessMessage?: boolean;
} 