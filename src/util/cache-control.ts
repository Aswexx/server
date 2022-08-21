import { Request, Response, NextFunction } from 'express'

const DURATION = 60 * 30 // half hour
export function setMaxAgeCache (req: Request, res: Response, next: NextFunction) {
  res.header({
    'Cache-Control': `max-age=${DURATION}`
  })
  next()
}
