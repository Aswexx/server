import { Server } from 'socket.io'

function chatSocket (io: Server) {
  const chat = io.of('/chat')
  chat.on('connection', (socket) => {
    console.log(`a user connect to chat socket. id: ${socket.id}`)

    socket.on('startChat', (roomId) => {
      console.log('🐶', roomId)
      socket.join(roomId)

      socket.emit('joined', 'you created room')
      socket.in(roomId).emit('joined', 'Welcome!')

      socket.on('newMsg', (msg) => {
        console.log(`server: ${msg}- ${socket.id}`)
        socket.in(roomId).emit('newMsg', msg)
      })
    })

    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected.\nreason: ${reason}`)
    })
  })
}

export {
  chatSocket
}
