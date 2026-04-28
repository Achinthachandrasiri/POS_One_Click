import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../../models/userModel'

// ── CONSTANTS ──
const JWT_SECRET = process.env.JWT_SECRET || 'HjlDCmvMd5wVH8ust7lSDDVZ'
const JWT_EXPIRES_IN = '8h'
const TEMP_ADMIN = {
  first_name: 'Temporary',
  last_name: 'Admin',
  email: 'admin.hardwarepos@gmail.com',
  mobile: '0771234567',
  password: 'Admin@1234',
  role: 'super_admin'
}

const ensureTemporaryAdminUser = async () => {
  const userCount = await User.countDocuments()

  if (userCount > 0) {
    return { created: false }
  }

  const existingTempAdmin = await User.findOne({ email: TEMP_ADMIN.email })
  if (existingTempAdmin) {
    return { created: false }
  }

  const hashedPassword = await bcrypt.hash(TEMP_ADMIN.password, 10)

  await User.create({
    first_name: TEMP_ADMIN.first_name,
    last_name: TEMP_ADMIN.last_name,
    email: TEMP_ADMIN.email,
    mobile: TEMP_ADMIN.mobile,
    password: hashedPassword,
    role: TEMP_ADMIN.role
  })

  return { created: true, credentials: TEMP_ADMIN }
}

const handleBootstrapTemporaryAdmin = async () => {
  try {
    const result = await ensureTemporaryAdminUser()

    return {
      success: true,
      created: result.created,
      credentials: result.created ? result.credentials : null,
      message: result.created
        ? 'Temporary admin created for first-time access'
        : 'User accounts already exist'
    }
  } catch (error) {
    console.error('Bootstrap temporary admin error:', error)
    return { success: false, error: 'Failed to prepare temporary admin account' }
  }
}

const handleLogin = async (data) => {
  const { username, password } = data || {}

  await ensureTemporaryAdminUser()

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

export { handleLogin, handleBootstrapTemporaryAdmin }
