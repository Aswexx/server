import bcrypt from 'bcrypt'

const saltRounds = 10

function hashSync (plainPassword: string) {
  return bcrypt.hashSync(plainPassword, saltRounds)
}

function compareSync (plainPassword: string, hash: string) {
  return bcrypt.compareSync(plainPassword, hash)
}

export {
  hashSync,
  compareSync
}
