import mongoose from 'mongoose'

const MAILER_OPTIONS = ['SMTP', 'SendGrid', 'Mailgun', 'Amazon SES']
const PORT_OPTIONS   = ['587', '465']

const mailSettingsSchema = new mongoose.Schema(
  {
    mail_mailer: {
      type: String,
      required: [true, 'Mail mailer is required'],
      enum: {
        values: MAILER_OPTIONS,
        message: `Mail mailer must be one of: ${MAILER_OPTIONS.join(', ')}`
      },
      trim: true
    },
    mail_host: {
      type: String,
      required: [true, 'Mail host is required'],
      trim: true
    },
    mail_port: {
      type: String,
      required: [true, 'Mail port is required'],
      enum: {
        values: PORT_OPTIONS,
        message: `Mail port must be one of: ${PORT_OPTIONS.join(', ')}`
      }
    },
    mail_sender_name: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true
    },
    mail_username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    }
  },
  {
    timestamps: true,
    collection: 'mail_settings'
  }
)

export const MailSettings = mongoose.model('MailSettings', mailSettingsSchema)