type LogMessage = {
  action: string
  message: string
  data?: Record<string, any>
}

export function generateLogMessage({ action, message, data }: LogMessage): void {
  console.log(`[ServerAction:${action}] ${message}`, {
    ...data,
    timestamp: new Date().toISOString(),
  })
} 