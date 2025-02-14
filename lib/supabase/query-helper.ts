import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Tables = Database['public']['Tables']
type TableName = keyof Tables
type Row<T extends TableName> = Tables[T]['Row']
type Insert<T extends TableName> = Tables[T]['Insert']

type ColumnValue = string | number | boolean | null | Date

interface QueryOptions<T extends TableName> {
  eq?: Partial<Record<keyof Row<T>, ColumnValue>>
  gt?: Partial<Record<keyof Row<T>, ColumnValue>>
  lt?: Partial<Record<keyof Row<T>, ColumnValue>>
  gte?: Partial<Record<keyof Row<T>, ColumnValue>>
  lte?: Partial<Record<keyof Row<T>, ColumnValue>>
  like?: Partial<Record<keyof Row<T>, string>>
  ilike?: Partial<Record<keyof Row<T>, string>>
  is?: Partial<Record<keyof Row<T>, ColumnValue>>
  in?: Partial<Record<keyof Row<T>, ColumnValue[]>>
  contains?: Partial<Record<keyof Row<T>, ColumnValue>>
  containedBy?: Partial<Record<keyof Row<T>, ColumnValue>>
  rangeGt?: Partial<Record<keyof Row<T>, ColumnValue>>
  rangeLt?: Partial<Record<keyof Row<T>, ColumnValue>>
  rangeGte?: Partial<Record<keyof Row<T>, ColumnValue>>
  rangeLte?: Partial<Record<keyof Row<T>, ColumnValue>>
  textSearch?: Partial<Record<keyof Row<T>, string>>
  match?: Partial<Record<keyof Row<T>, ColumnValue>>
  not?: Partial<Record<keyof Row<T>, ColumnValue>>
  or?: string
  order?: Partial<Record<keyof Row<T>, 'asc' | 'desc'>>
  limit?: number
  offset?: number
  isServer?: boolean
}

interface UpsertOptions {
  onConflict?: string
  isServer?: boolean
}

/**
 * Select data from a table with flexible query options
 */
export async function selectFromTable<T extends TableName>(
  table: T,
  options: QueryOptions<T> = {}
): Promise<Row<T> | null> {
  const query = supabase.from(table)

  // Apply filters
  if (options.eq) {
    for (const [column, value] of Object.entries(options.eq)) {
      query.eq(column, value)
    }
  }

  if (options.gt) {
    for (const [column, value] of Object.entries(options.gt)) {
      query.gt(column, value)
    }
  }

  // ... Add other filter types as needed

  // Apply ordering
  if (options.order) {
    for (const [column, direction] of Object.entries(options.order)) {
      query.order(column, { ascending: direction === 'asc' })
    }
  }

  // Apply pagination
  if (options.limit) {
    query.limit(options.limit)
  }

  if (options.offset) {
    query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query.select().single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Insert or update data in a table
 */
export async function upsertTable<T extends TableName>(
  table: T,
  data: Insert<T>,
  options: UpsertOptions = {}
): Promise<Row<T>> {
  const query = supabase.from(table)

  const upsertQuery = query.upsert(data)

  if (options.onConflict) {
    upsertQuery.onConflict(options.onConflict)
  }

  const { data: result, error } = await upsertQuery.select().single()

  if (error) {
    throw error
  }

  return result as Row<T>
}

/**
 * Delete data from a table
 */
export async function deleteFromTable<T extends TableName>(
  table: T,
  options: QueryOptions<T> = {}
): Promise<void> {
  const query = supabase.from(table)

  if (options.eq) {
    for (const [column, value] of Object.entries(options.eq)) {
      query.eq(column, value)
    }
  }

  const { error } = await query.delete()

  if (error) {
    throw error
  }
}

/**
 * Count rows in a table
 */
export async function countTable<T extends TableName>(
  table: T,
  options: QueryOptions<T> = {}
): Promise<number> {
  const query = supabase.from(table)

  if (options.eq) {
    for (const [column, value] of Object.entries(options.eq)) {
      query.eq(column, value)
    }
  }

  const { count, error } = await query.select('*', { count: 'exact', head: true })

  if (error) {
    throw error
  }

  return count || 0
}

export default {
  selectFromTable,
  upsertTable,
  deleteFromTable,
  countTable
} 