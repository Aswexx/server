import http from 'http'
import app from './app'
import { Server } from 'socket.io'
import { chatSocket } from './chatSocket'
import { notificationSocket } from './notificationSocket'

const PORT = process.env.PORT || 3000
const apiServer = http.createServer(app)
const io = new Server(apiServer, {
  cors: {
    origin: ['http://localhost:8080', 'http://192.168.1.106:8080']
  }
})

chatSocket(io)
notificationSocket(io)

// io.on('connection', (socket) => {
//   console.log(`a user connected. id: ${socket.id}`)

//   socket.on('startChat', (roomId) => {
//     socket.join(roomId)

//     socket.emit('joined', 'you created room')
//     socket.in(roomId).emit('joined', 'Welcome!')

//     socket.on('newMsg', (msg) => {
//       console.log(`server: ${msg}- ${socket.id}`)
//       socket.in(roomId).emit('newMsg', msg)
//     })
//   })

//   socket.on('disconnect', (reason) => {
//     console.log(`Client ${socket.id} disconnected. ${reason}`)
//   })
// })

apiServer.listen(PORT, () => {
  console.log(`
    http://localhost:${PORT}
  `)
})
