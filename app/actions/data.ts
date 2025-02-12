'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/utils/error-handler'
import type { Database } from '@/types/supabase/database'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

type Tables = Database['public']['Tables']
type TableNames = keyof Tables

type TableRow<T extends TableNames> = Tables[T]['Row']
type TableInsert<T extends TableNames> = Tables[T]['Insert']
type TableUpdate<T extends TableNames> = Tables[T]['Update']

type FilterValue = string | number | boolean | null

/**
 * Generic function to fetch data from any table
 */
export async function fetchTableData<T extends TableNames>(
  table: T,
  query?: {
    select?: string
    eq?: Array<[keyof TableRow<T> & string, FilterValue]>
    order?: [keyof TableRow<T> & string, 'asc' | 'desc']
    limit?: number
  }
) {
  const supabase = createClient()
  let queryBuilder = supabase.from(table).select(query?.select || '*') as PostgrestFilterBuilder<
    Database['public'],
    Tables[T]['Row'],
    Tables[T]['Row']
  >

  if (query?.eq) {
    query.eq.forEach(([column, value]) => {
      queryBuilder = queryBuilder.eq(column, value)
    })
  }

  if (query?.order) {
    const [column, direction] = query.order
    queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' })
  }

  if (query?.limit) {
    queryBuilder = queryBuilder.limit(query.limit)
  }

  const { data, error } = await queryBuilder

  if (error) {
    return { data: null, error: handleError('Failed to fetch data') }
  }

  return { data, error: null }
}

/**
 * Generic function to insert data into any table
 */
export async function insertTableData<T extends TableNames>(
  table: T,
  data: Tables[T]['Insert'],
  path?: string
) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) {
    return { data: null, error: handleError('Failed to insert data') }
  }

  if (path) {
    revalidatePath(path)
  }

  return { data: result, error: null }
}

/**
 * Generic function to update data in any table
 */
export async function updateTableData<T extends TableNames>(
  table: T,
  id: string | number,
  data: Tables[T]['Update'],
  path?: string
) {
  const supabase = createClient()
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: handleError('Failed to update data') }
  }

  if (path) {
    revalidatePath(path)
  }

  return { data: result, error: null }
}

/**
 * Generic function to delete data from any table
 */
export async function deleteTableData<T extends TableNames>(
  table: T,
  id: string | number,
  path?: string
) {
  const supabase = createClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return { error: handleError('Failed to delete data') }
  }

  if (path) {
    revalidatePath(path)
  }

  return { error: null }
}