export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  console.log('[useSupabase] Called', context); // Log the entire context
  return context;
}; 