'use client';

import { createContext, useContext } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseContext = {
  supabaseClient: SupabaseClient;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function SupabaseProvider({
  children,
  supabaseClient,
}: {
  children: React.ReactNode;
  supabaseClient: SupabaseClient;
}) {
  return (
    <Context.Provider value={{ supabaseClient }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}; 