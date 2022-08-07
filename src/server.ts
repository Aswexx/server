import http from 'http'
import app from './app'

const server = http.createServer(app)
const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`
  http://localhost:${PORT}
  http://localhost:${PORT}/test
  `)
})
