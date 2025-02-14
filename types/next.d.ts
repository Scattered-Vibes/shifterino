export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface PageProps<T = Record<string, string>> {
  params: T
  searchParams: SearchParams
} 