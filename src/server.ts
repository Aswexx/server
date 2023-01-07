// import http from 'http'
import https from 'https'
import fs from 'fs'
import app from './app'
import { Server } from 'socket.io'
import { chatSocket } from './chatSocket'
import { notificationSocket } from './notificationSocket'

const PORT = process.env.PORT || 3000
const key = fs.readFileSync('./192.168.0.103-key.pem')
const cert = fs.readFileSync('./192.168.0.103.pem')
const apiServer = https.createServer({ key, cert }, app)

const io = new Server(apiServer, {
  cors: {
    origin: ['http://localhost:8080', 'https://192.168.0.103:8080']
  }
})

chatSocket(io)
notificationSocket(io)

apiServer.listen(PORT, () => {
  console.log(`
    http://localhost:${PORT}
  `)
})
