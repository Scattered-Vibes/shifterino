import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Set log level via environment variable
  transport: {
    target: 'pino-pretty', // Use pino-pretty for human-readable output in development
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export default logger; 