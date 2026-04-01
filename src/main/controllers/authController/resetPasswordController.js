import nodemailer from 'nodemailer'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { User } from '../../models/userModel'

// ── EMAIL TRANSPORTER ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS   // use Gmail App Password (not your real password)
  }
})

// ── GENERATE 6-DIGIT OTP ──────────────────────────────────────────────────────
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString()
}

// ── SEND OTP ──────────────────────────────────────────────────────────────────
export const handleSendOtp = async (data) => {
  const { username } = data || {}

  if (!username) {
    return { success: false, error: 'Email is required' }
  }
  if (!username.endsWith('@gmail.com')) {
    return { success: false, error: 'Email must be a @gmail.com address' }
  }

  try {
    const user = await User.findOne({ email: username.trim().toLowerCase() })

    if (!user) {
      return { success: false, error: 'No account found with this email' }
    }

    if (user.is_locked) {
      return { success: false, error: 'Your account is locked. Contact an administrator.' }
    }

    // Generate and save OTP in DB (expires in 10 min — handled by saveResetOtp method)
    const otp = generateOtp()
    await user.saveResetOtp(otp)

    // Send email
    await transporter.sendMail({
      from: `"Alpha Devs" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: 'Your password reset code',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a6b7a;">Password Reset</h2>
          <p>Hi ${user.first_name},</p>
          <p>Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="letter-spacing: 10px; font-size: 32px; font-weight: bold; color: #1a6b7a; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email.</p>
          <p style="color: #999; font-size: 13px;">— Alpha Devs</p>
        </div>
      `
    })

    return { success: true }

  } catch (error) {
    console.error('Send OTP error:', error)
    return { success: false, error: 'Failed to send OTP. Please try again.' }
  }
}

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
export const handleVerifyOtp = async (data) => {
  const { username, otp } = data || {}

  if (!username || !otp) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    const user = await User.findOne({ email: username.trim().toLowerCase() })

    if (!user) {
      return { success: false, error: 'No account found with this email' }
    }

    // Check OTP exists
    if (!user.reset_otp || !user.reset_otp_expires_at) {
      return { success: false, error: 'No OTP was requested. Please request a new one.' }
    }

    // Check expiry
    if (new Date() > user.reset_otp_expires_at) {
      await user.clearResetOtp()
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    // Check OTP match
    if (user.reset_otp !== otp.trim()) {
      return { success: false, error: 'Invalid OTP. Please try again.' }
    }

    // Clear OTP after successful verification
    await user.clearResetOtp()

    return { success: true }

  } catch (error) {
    console.error('Verify OTP error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
export const handleChangePassword = async (data) => {
  const { username, newPassword } = data || {}

  if (!username || !newPassword) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    const user = await User.findOne({ email: username.trim().toLowerCase() })

    if (!user) {
      return { success: false, error: 'No account found with this email' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await user.updatePassword(hashedPassword)

    return { success: true }

  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
