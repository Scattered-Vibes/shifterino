// Dashboard route parameters
export type DashboardParams = {
  view?: 'calendar' | 'list';
  date?: string;
  employeeId?: string;
};

// Schedule route parameters
export type ScheduleParams = {
  id: string;
  tab?: 'overview' | 'shifts' | 'employees';
};

// API route parameters
export type ApiRouteParams = {
  path: string[];
  searchParams: Record<string, string>;
};

// Navigation types
export type NavigationItem = {
  href: string;
  label: string;
  icon?: string;
  children?: NavigationItem[];
};

// Route metadata
export interface RouteMetadata {
  title: string;
  description?: string;
  keywords?: string[];
}

// Dynamic route parameters
export type DynamicRouteParams = {
  params: Record<string, string | string[]>;
  searchParams: Record<string, string | string[]>;
}; 