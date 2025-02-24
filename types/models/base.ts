export interface BaseModel {
  id: string
  created_at: string
  updated_at: string
}

export interface TimestampFields {
  created_at: string
  updated_at: string
}

export type WithTimestamps<T> = T & TimestampFields 