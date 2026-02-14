import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

// Safely configure pino-pretty transport in dev mode
// Falls back to default JSON transport if pino-pretty is unavailable
function getTransportConfig() {
  if (!isDev) return undefined

  try {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
  } catch {
    // pino-pretty not available, use default JSON transport
    return undefined
  }
}

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: getTransportConfig(),
})

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId })
}
