export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Route handler response types
export type RouteHandlerResponse<T> = Promise<Response & {
  json: () => Promise<ApiResponse<T>>;
}>;

// API Status codes
export type ApiStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

// Common API parameters
export interface ApiQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
} 