/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, status: number = 500) {
  return Response.json(
    { error: message },
    { status }
  )
} 