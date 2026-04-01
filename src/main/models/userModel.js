import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },

    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => v.endsWith('@gmail.com'),
        message: 'Email must be a @gmail.com address'
      }
    },

    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: (v) => /^0\d{9}$/.test(v),
        message: 'Mobile must be 10 digits and start with 0'
      }
    },

    password: {
      type: String,
      required: [true, 'Password is required']
    },

    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['super_admin', 'admin', 'user'],
      default: 'user'
    },

    // ── Lock Management ──
    failed_attempts: {
      type: Number,
      default: 0
    },

    is_locked: {
      type: Boolean,
      default: false
    },

    locked_at: {
      type: Date,
      default: null
    },

    // ── Reset Password OTP ──
    reset_otp: {
      type: String,
      default: null
    },

    reset_otp_expires_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// ── INCREMENT FAILED ATTEMPTS ──
// Locks user permanently after 5 failed attempts
userSchema.methods.incrementFailedAttempts = async function () {
  this.failed_attempts += 1

  if (this.failed_attempts >= 5) {
    this.is_locked = true
    this.locked_at = new Date()
  }

  await this.save()
  return { attempts: this.failed_attempts, isLocked: this.is_locked }
}

// ── RESET FAILED ATTEMPTS (on successful login) ──
userSchema.methods.resetFailedAttempts = async function () {
  this.failed_attempts = 0
  await this.save()
}

// ── UNLOCK USER (by super admin only) ──
userSchema.methods.unlockUser = async function () {
  this.is_locked = false
  this.failed_attempts = 0
  this.locked_at = null
  await this.save()
  return { success: true, message: 'User unlocked successfully' }
}

// ── SAVE RESET OTP ──
userSchema.methods.saveResetOtp = async function (otp) {
  this.reset_otp = otp
  this.reset_otp_expires_at = new Date(Date.now() + 10 * 60 * 1000)
  await this.save()
}

// ── CLEAR RESET OTP ──
userSchema.methods.clearResetOtp = async function () {
  this.reset_otp = null
  this.reset_otp_expires_at = null
  await this.save()
}

// ── UPDATE PASSWORD ──
userSchema.methods.updatePassword = async function (hashedPassword) {
  this.password = hashedPassword
  this.reset_otp = null
  this.reset_otp_expires_at = null
  await this.save()
}

export const User = mongoose.model('User', userSchema)
