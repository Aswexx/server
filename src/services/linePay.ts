import axios from 'axios'
import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { redisClient } from './redis'

const LINE_PAY_URL = 'https://sandbox-api-pay.line.me/v3/payments/request'
const REQ_URI = '/v3/payments/request'
const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET_KEY } = process.env

const DOMAIN_NAME =
  process.env.HOST_ENV === 'dev'
    ? 'https://192.168.0.105:4000'
    : 'https://joeln-api.fun'

async function generateOrder (userId: string) {
  const order = {
    amount: 10,
    currency: 'TWD',
    orderId: crypto.randomUUID(),
    packages: [
      {
        id: crypto.randomBytes(8).toString('hex'),
        amount: 10,
        name: 'Posquare Sponsor Membership',
        products: [
          {
            name: 'Posquare Sponsor Membership',
            quantity: 1,
            price: 10
          }
        ]
      }
    ],
    redirectUrls: {
      confirmUrl: `${DOMAIN_NAME}/users/sponsor/confirm`,
      cancelUrl: `${DOMAIN_NAME}/users/sponsor/cancel`
    }
  }

  await redisClient.setEx(`orderId:${order.orderId}`, 10 * 60, userId)
  return order
}

function generateConfig (order: object) {
  const nonce = crypto.randomUUID()
  const stringToConvert =
    `${LINE_CHANNEL_SECRET_KEY}${REQ_URI}${JSON.stringify(order)}${nonce}`
  const signature = crypto
    .createHmac('sha256', LINE_CHANNEL_SECRET_KEY as string)
    .update(stringToConvert)
    .digest('base64')
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINE_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature
    }
  }
}

async function submitLinePayOrder (userId: string) {
  const order = await generateOrder(userId)
  const config = generateConfig(order)

  return await axios.post(LINE_PAY_URL, order, config)
}

async function linePay (req: Request, res: Response, next: NextFunction) {
  const { userId } = req.body
  const linePayResponse = await submitLinePayOrder(userId)

  if (linePayResponse.data.returnCode === '0000') {
    return res.json({ linePay: linePayResponse.data.info.paymentUrl.web })
  }

  res.json(null)
}

async function payConfirm (req: Request, res: Response, next: NextFunction) {
  const { transactionId, orderId } = req.query
  console.log('req', transactionId, orderId)
  const userId = await redisClient.get(`orderId:${orderId}`)
  console.log('checkUserId', userId)
  req.body = { userId }
  next()
}

async function payCancel (req: Request, res: Response, next: NextFunction) {
  return res.send('交易取消')
}

export { linePay, payConfirm, payCancel }
