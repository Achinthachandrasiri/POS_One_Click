import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simulate model instance
const makeUser = (overrides = {}) => ({
  failed_attempts: 0,
  is_locked: false,
  locked_at: null,
  reset_otp: null,
  reset_otp_expires_at: null,
  password: 'old_hashed',
  save: vi.fn().mockResolvedValue(true),

  async incrementFailedAttempts() {
    this.failed_attempts += 1
    if (this.failed_attempts >= 5) {
      this.is_locked = true
      this.locked_at = new Date()
    }
    await this.save()
    return { attempts: this.failed_attempts, isLocked: this.is_locked }
  },

  async resetFailedAttempts() {
    this.failed_attempts = 0
    await this.save()
  },

  async unlockUser() {
    this.is_locked = false
    this.failed_attempts = 0
    this.locked_at = null
    await this.save()
    return { success: true, message: 'User unlocked successfully' }
  },

  async saveResetOtp(otp) {
    this.reset_otp = otp
    this.reset_otp_expires_at = new Date(Date.now() + 10 * 60 * 1000)
    await this.save()
  },

  async clearResetOtp() {
    this.reset_otp = null
    this.reset_otp_expires_at = null
    await this.save()
  },

  async updatePassword(hashed) {
    this.password = hashed
    this.reset_otp = null
    this.reset_otp_expires_at = null
    await this.save()
  },

  ...overrides
})

// ── incrementFailedAttempts ────────────────────────────────────────────────────

describe('incrementFailedAttempts', () => {
  it('increments counter by 1', async () => {
    const user = makeUser()
    const result = await user.incrementFailedAttempts()
    expect(result.attempts).toBe(1)
    expect(result.isLocked).toBe(false)
  })

  it('does not lock before 5 attempts', async () => {
    const user = makeUser({ failed_attempts: 3 })
    const result = await user.incrementFailedAttempts()
    expect(result.attempts).toBe(4)
    expect(result.isLocked).toBe(false)
  })

  it('locks user at exactly 5 attempts', async () => {
    const user = makeUser({ failed_attempts: 4 })
    const result = await user.incrementFailedAttempts()
    expect(result.attempts).toBe(5)
    expect(result.isLocked).toBe(true)
    expect(user.locked_at).toBeInstanceOf(Date)
  })

  it('calls save after updating', async () => {
    const user = makeUser()
    await user.incrementFailedAttempts()
    expect(user.save).toHaveBeenCalledOnce()
  })
})

// ── resetFailedAttempts ────────────────────────────────────────────────────────

describe('resetFailedAttempts', () => {
  it('resets counter to 0', async () => {
    const user = makeUser({ failed_attempts: 3 })
    await user.resetFailedAttempts()
    expect(user.failed_attempts).toBe(0)
    expect(user.save).toHaveBeenCalledOnce()
  })
})

// ── unlockUser ─────────────────────────────────────────────────────────────────

describe('unlockUser', () => {
  it('clears lock state and resets attempts', async () => {
    const user = makeUser({ is_locked: true, failed_attempts: 5, locked_at: new Date() })
    const result = await user.unlockUser()
    expect(result.success).toBe(true)
    expect(user.is_locked).toBe(false)
    expect(user.failed_attempts).toBe(0)
    expect(user.locked_at).toBeNull()
  })
})

// ── saveResetOtp ───────────────────────────────────────────────────────────────

describe('saveResetOtp', () => {
  it('stores OTP and sets expiry ~10 minutes from now', async () => {
    const user = makeUser()
    const before = Date.now()
    await user.saveResetOtp('654321')
    const after = Date.now()

    expect(user.reset_otp).toBe('654321')
    const expiry = user.reset_otp_expires_at.getTime()
    expect(expiry).toBeGreaterThanOrEqual(before + 10 * 60 * 1000 - 50)
    expect(expiry).toBeLessThanOrEqual(after + 10 * 60 * 1000 + 50)
  })
})

// ── clearResetOtp ──────────────────────────────────────────────────────────────

describe('clearResetOtp', () => {
  it('nullifies OTP fields', async () => {
    const user = makeUser({ reset_otp: '999999', reset_otp_expires_at: new Date() })
    await user.clearResetOtp()
    expect(user.reset_otp).toBeNull()
    expect(user.reset_otp_expires_at).toBeNull()
  })
})

// ── updatePassword ─────────────────────────────────────────────────────────────

describe('updatePassword', () => {
  it('sets new hashed password and clears OTP fields', async () => {
    const user = makeUser({ reset_otp: '111111', reset_otp_expires_at: new Date() })
    await user.updatePassword('new_hashed_pw')
    expect(user.password).toBe('new_hashed_pw')
    expect(user.reset_otp).toBeNull()
    expect(user.reset_otp_expires_at).toBeNull()
  })
})
