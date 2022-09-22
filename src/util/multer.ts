import multer from 'multer'

const storage = multer.memoryStorage()
export const upload = multer({ storage }).single('file')
export const uploadProfileImages =
  multer({ storage, limits: { fileSize: 1 * 1024 * 1024 } }).fields([{
    name: 'backgroundImage', maxCount: 1
  }, {
    name: 'avatarImage', maxCount: 1
  }])
