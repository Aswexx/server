import { EventEmitter } from 'stream'
import { redisClient } from '../services/redis'

const eventEmitter = new EventEmitter()

class Mutex {
  lockedKeys: { [key: string]: string } = {}

  async lock (key: string) {
    if (!this.lockedKeys[key]) {
      this.lockedKeys[key] = key
      console.log('after lock', this.lockedKeys)
      const cacheResult = await redisClient.get(key)
      if (cacheResult) {
        return cacheResult
      }
    } else {
      eventEmitter.on('lockable', this.tryLock)
    }
  }

  private tryLock (key: string) {
    if (!this.lockedKeys[key]) {
      this.lockedKeys[key] = key
      eventEmitter.removeListener('lockable', this.tryLock)
    }
  }

  releaseLock (key: string) {
    delete this.lockedKeys[key]
    console.log('after delete', this.lockedKeys)
    eventEmitter.emit('lockable')
  }
}

export { Mutex }
