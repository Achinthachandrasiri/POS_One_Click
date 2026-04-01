import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/userModel'

// ── CONSTANTS ──
const JWT_SECRET = process.env.JWT_SECRET || 'HjlDCmvMd5wVH8ust7lSDDVZ'
const JWT_EXPIRES_IN = '8h'

const handleLogin = async (data) => {
  const { username, password } = data || {}

  // Input Validation ______________________________________________________________________________
  if (!username) {
    return { success: false, fieldErrors: { username: 'Email is required' } }
  }
  if (!username.endsWith('@gmail.com')) {
    return { success: false, fieldErrors: { username: 'Email must be a @gmail.com address' } }
  }
  if (!password) {
    return { success: false, fieldErrors: { password: 'Password is required' } }
  }
  if (password.length < 8) {
    return { success: false, fieldErrors: { password: 'Password must be at least 8 characters' } }
  }

  try {
    // Find User in DB _____________________________________________________________________________
    const user = await User.findOne({ email: username.trim().toLowerCase() })

    if (!user) {
      return { success: false, fieldErrors: { username: 'No account found with this email' } }
    }

    // Check if Account is Locked __________________________________________________________________
    if (user.is_locked) {
      return {
        success: false,
        fieldErrors: {
          username: `Your account has been locked due to too many failed attempts. Contact an administrator.`
        }
      }
    }

    // Verify Password _____________________________________________________________________________
    const isPasswordMatch = await bcrypt.compare(password.trim(), user.password)

    if (!isPasswordMatch) {
      const { attempts, isLocked } = await user.incrementFailedAttempts()

      if (isLocked) {
        return {
          success: false,
          fieldErrors: {
            password: `Too many failed attempts. Your account has been locked. Contact an administrator.`
          }
        }
      }

      return {
        success: false,
        fieldErrors: {
          password: `Incorrect password. ${5 - attempts} attempt(s) remaining before lockout.`
        }
      }
    }

    // Successful Login — Reset Failed Attempts _____________________________________________________
    await user.resetFailedAttempts()

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      full_name: `${user.first_name} ${user.last_name}`
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    // Return Success ______________________________________________________________________________
    return {
      success: true,
      token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      fieldErrors: { general: 'An unexpected error occurred. Please try again.' }
    }
  }
}

export { handleLogin }
