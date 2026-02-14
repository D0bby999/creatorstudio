import pino from 'pino'
import { createRequire } from 'node:module'

const isDev = process.env.NODE_ENV === 'development'

function getTransportConfig() {
  if (!isDev) return undefined

  try {
    const require = createRequire(import.meta.url)
    require.resolve('pino-pretty')
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
  } catch {
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
