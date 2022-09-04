import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  // host: 'localhost',
  // port: 587,
  secure: true,
  logger: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_Key
  }
})

export function sendMail (email: string) {
  const mailOptions: Mail.Options = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'miniTwi email vertification',
    text: 'hello 驗證碼為 1234',
    attachments: []
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) return err
    console.log(info)
  })
}
