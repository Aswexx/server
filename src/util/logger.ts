import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/requests.log'
    })
  ]
})

process.on('uncaughtException', (err) => {
  logger.error(err.message, { stack: err.stack })
})
