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

export function sendMail (email: string, vertificationCode: string) {
  const mailOptions: Mail.Options = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Posquare email vertification',
    text: `您的驗證碼為 ${vertificationCode}`,
    attachments: []
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) return err
    console.log(info)
  })
}
