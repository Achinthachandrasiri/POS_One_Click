import { MailSettings } from '../../models/mailSettingsModel'

const MAILER_OPTIONS = ['SMTP', 'SendGrid', 'Mailgun', 'Amazon SES']
const PORT_OPTIONS   = ['587', '465']

const serialize = (doc) => ({
  ...doc.toObject(),
  _id: doc._id.toString()
})

export const handleGetMailSettings = async () => {
  try {
    const settings = await MailSettings.findOne().sort({ createdAt: -1 })
    if (!settings) return { success: false, error: 'Mail settings not found' }
    return { success: true, data: serialize(settings) }
  } catch (error) {
    console.error('handleGetMailSettings error:', error)
    return { success: false, error: 'Failed to fetch mail settings' }
  }
}

export const handleSaveMailSettings = async ({
  mail_mailer,
  mail_host,
  mail_port,
  mail_sender_name,
  mail_username
}) => {
  if (!mail_mailer) {
    return { success: false, error: 'Mail mailer is required' }
  }
  if (!MAILER_OPTIONS.includes(mail_mailer)) {
    return { success: false, error: `Mail mailer must be one of: ${MAILER_OPTIONS.join(', ')}` }
  }
  if (!mail_host || mail_host.trim() === '') {
    return { success: false, error: 'Mail host is required' }
  }
  if (!mail_port) {
    return { success: false, error: 'Mail port is required' }
  }
  if (!PORT_OPTIONS.includes(mail_port)) {
    return { success: false, error: `Mail port must be one of: ${PORT_OPTIONS.join(', ')}` }
  }
  if (!mail_sender_name || mail_sender_name.trim() === '') {
    return { success: false, error: 'Sender name is required' }
  }
  if (!mail_username || mail_username.trim() === '') {
    return { success: false, error: 'Username is required' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail_username.trim())) {
    return { success: false, error: 'Enter a valid email address' }
  }

  try {
    // Upsert — only one mail settings document ever exists
    const settings = await MailSettings.findOneAndUpdate(
      {},
      {
        mail_mailer,
        mail_host: mail_host.trim(),
        mail_port,
        mail_sender_name: mail_sender_name.trim(),
        mail_username: mail_username.trim().toLowerCase()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    return { success: true, data: serialize(settings) }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message)
      return { success: false, error: messages.join(', ') }
    }
    console.error('handleSaveMailSettings error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}