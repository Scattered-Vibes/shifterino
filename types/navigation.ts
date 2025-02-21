import { LucideIcon } from 'lucide-react';

export type UserRole = 'admin' | 'supervisor' | 'dispatcher' | 'manager';

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  roles?: UserRole[];
}

export interface NavigationConfig {
  items: NavItem[];
} 