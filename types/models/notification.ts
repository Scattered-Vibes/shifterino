import { Database } from '@/types/supabase/database';

export type NotificationType = 'time_off_request' | 'shift_swap_request' | 'schedule_update';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

// Supabase types
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']; 