import { setEnvVar } from './env.config'
import { Server } from 'socket.io'
import http from 'http'
import https from 'https'
import fs from 'fs'
import { Express } from 'express'

function createApiServer (app: Express) {
  if (process.env.HOST_ENV === 'dev') {
    const key = fs.readFileSync('./192.168.0.103-key.pem')
    const cert = fs.readFileSync('./192.168.0.103.pem')
    return https.createServer({ key, cert }, app)
  } else {
    return http.createServer(app)
  }
}

(async function () {
  if (process.env.HOST_ENV === 'dev') {
    require('dotenv').config()
  } else {
    await setEnvVar()
  }

  const app = await import('./app')
  const { chatSocket } = await import('./chatSocket')
  const { notificationSocket } = await import('./notificationSocket')
  const PORT = process.env.PORT || 3000
  const apiServer = createApiServer(app.default)
  const io = new Server(apiServer, {
    cors: {
      origin: [
        'http://localhost:8080',
        'https://192.168.0.101:8080',
        'https://192.168.0.103:8080',
        'https://192.168.0.105:8080',
        'https://joeln.site'
      ]
    }
  })

  chatSocket(io)
  notificationSocket(io)

  apiServer.listen(PORT, () => {
    console.log(
      `http://localhost:${PORT}/test2`,
      '02191718'
    )
  })
})()
