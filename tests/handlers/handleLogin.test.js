import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:crypto', () => ({
  default: { randomInt: vi.fn(() => 123456) }
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn().mockResolvedValue(true)
    })
  }
}))

vi.mock('../../src/main/models/userModel', () => ({
  User: { findOne: vi.fn() }
}))

vi.mock('bcryptjs')

import { handleSendOtp, handleVerifyOtp, handleChangePassword } from '../../src/main/controllers/authController/resetPasswordController'
import { User } from '../../src/main/models/userModel'
import bcrypt from 'bcryptjs'

const mockUser = {
  email: 'test@gmail.com',
  first_name: 'John',
  is_locked: false,
  reset_otp: '123456',
  reset_otp_expires_at: new Date(Date.now() + 5 * 60 * 1000),
  saveResetOtp: vi.fn(),
  clearResetOtp: vi.fn(),
  updatePassword: vi.fn()
}

beforeEach(() => vi.clearAllMocks())

// ── handleSendOtp ──────────────────────────────────────────────────────────────

describe('handleSendOtp', () => {
  it('returns error when email is missing', async () => {
    const res = await handleSendOtp({})
    expect(res.success).toBe(false)
    expect(res.error).toBe('Email is required')
  })

  it('returns error for non-gmail address', async () => {
    const res = await handleSendOtp({ username: 'user@outlook.com' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/@gmail\.com/i)
  })

  it('returns error when user not found', async () => {
    User.findOne.mockResolvedValue(null)
    const res = await handleSendOtp({ username: 'ghost@gmail.com' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/no account/i)
  })

  it('returns error when account is locked', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, is_locked: true })
    const res = await handleSendOtp({ username: 'test@gmail.com' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/locked/i)
  })

  it('sends OTP and returns success for valid user', async () => {
    User.findOne.mockResolvedValue(mockUser)
    const res = await handleSendOtp({ username: 'test@gmail.com' })
    expect(res.success).toBe(true)
    expect(mockUser.saveResetOtp).toHaveBeenCalledOnce()
  })
})

// ── handleVerifyOtp ────────────────────────────────────────────────────────────

describe('handleVerifyOtp', () => {
  it('returns error when fields are missing', async () => {
    const res = await handleVerifyOtp({ username: 'test@gmail.com' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/missing/i)
  })

  it('returns error when OTP has not been requested', async () => {
    User.findOne.mockResolvedValue({ ...mockUser, reset_otp: null, reset_otp_expires_at: null })
    const res = await handleVerifyOtp({ username: 'test@gmail.com', otp: '123456' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/no OTP was requested/i)
  })

  it('returns error when OTP has expired', async () => {
    User.findOne.mockResolvedValue({
      ...mockUser,
      reset_otp_expires_at: new Date(Date.now() - 1000),
      clearResetOtp: vi.fn()
    })
    const res = await handleVerifyOtp({ username: 'test@gmail.com', otp: '123456' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/expired/i)
  })

  it('returns error when OTP does not match', async () => {
    User.findOne.mockResolvedValue(mockUser)
    const res = await handleVerifyOtp({ username: 'test@gmail.com', otp: '000000' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/invalid OTP/i)
  })

  it('clears OTP and returns success on correct code', async () => {
    User.findOne.mockResolvedValue(mockUser)
    const res = await handleVerifyOtp({ username: 'test@gmail.com', otp: '123456' })
    expect(res.success).toBe(true)
    expect(mockUser.clearResetOtp).toHaveBeenCalledOnce()
  })
})

// ── handleChangePassword ───────────────────────────────────────────────────────

describe('handleChangePassword', () => {
  it('returns error when fields are missing', async () => {
    const res = await handleChangePassword({ username: 'test@gmail.com' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/missing/i)
  })

  it('returns error when user not found', async () => {
    User.findOne.mockResolvedValue(null)
    const res = await handleChangePassword({ username: 'ghost@gmail.com', newPassword: 'newpass123' })
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/no account/i)
  })

  it('hashes password and updates user on success', async () => {
    User.findOne.mockResolvedValue(mockUser)
    bcrypt.hash.mockResolvedValue('hashed_new_password')

    const res = await handleChangePassword({ username: 'test@gmail.com', newPassword: 'newpass123' })
    expect(res.success).toBe(true)
    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10)
    expect(mockUser.updatePassword).toHaveBeenCalledWith('hashed_new_password')
  })
})
