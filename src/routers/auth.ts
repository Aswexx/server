import express, { Express, Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { Strategy, StrategyOptionsWithRequest, VerifyCallback, Profile } from 'passport-google-oauth20'
require('dotenv').config()

export
const authRouter = express.Router()
// Oauth Options
export
const oAuthConfig = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  SESSION_KEY1: process.env.SESSION_KEY1 as string,
  SESSION_KEY2: process.env.SESSION_KEY2 as string
}

const AUTH_OPTIONS: StrategyOptionsWithRequest = {
  callbackURL: '/auth/google/callback',
  clientID: oAuthConfig.CLIENT_ID as string,
  clientSecret: oAuthConfig.CLIENT_SECRET as string,
  passReqToCallback: true
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface User {
      id: string,
    }
  }
}

function verifyCallback (req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
  if (!req.user) {
    console.log('id: ' + profile.id)
    console.log('name: ' + profile.displayName)
    console.log('email: ' + profile.emails?.[0].value)
    console.log('avatar: ' + profile.photos?.[0].value)
  }
  done(null, profile)
}

//* save session to cookie
passport.serializeUser((user, done) => {
  done(null, user.id)
})

//* read sesssion from cookie so that req.user is available
passport.deserializeUser((user: Express.User, done) => {
  done(null, user)
})

//
function checkLoggedIn (req: Request, res: Response, next: NextFunction): void | Response {
  const isLoggedIn = req.isAuthenticated() && req.user

  if (!isLoggedIn) {
    return res.status(401).json({
      error: 'Plz log in.'
    })
  }

  next()
}

function hasPermission (req: Request, res: Response, next: NextFunction): void {
  // *TODO: some permission checking
  next()
}

authRouter.get('/show', (req: Request, res: Response) => {
  res.send(`${req.user}
  `)
})

authRouter.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/failure',
  successRedirect: '/show',
  session: true
}))

authRouter.get('/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile']
  })
)

authRouter.get('/auth/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout(
    (err) => {
      if (err) { return next(err) }
    })
  return res.redirect('/')
})

authRouter.get('/failure', (_req: Request, res: Response) => {
  res.send('Login fail')
})

authRouter.get('/secret', checkLoggedIn, hasPermission, (_req: Request, res: Response) => {
  res.send('Secret Value is 53!')
})

authRouter.use('/', (_req: Request, res: Response) => {
  res.send(`
    <h1>Hi!</h1>
    <a href='/secret'>Take Secret</a>
    <br>
    <a href='/auth/google'>google sign in</a>
    <br>
    <a href='/auth/logout'>google sign out</a>
  `)
})
