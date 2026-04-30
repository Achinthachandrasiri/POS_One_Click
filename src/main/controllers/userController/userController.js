import bcrypt from 'bcryptjs'
import { User } from '../../models/userModel'

// ── CONSTANTS ──
const SALT_ROUNDS = 10

// ── SERIALIZE HELPER ──
const serializeUser = (user) => {
  if (!user) return null
  const plain = typeof user.toObject === 'function' ? user.toObject() : user
  return {
    ...plain,
    _id: plain?._id?.toString ? plain._id.toString() : plain?._id,
    createdAt: plain?.createdAt?.toString ? plain.createdAt.toString() : plain?.createdAt,
    updatedAt: plain?.updatedAt?.toString ? plain.updatedAt.toString() : plain?.updatedAt
  }
}

// ── VALIDATION HELPER ──
const validateUserFields = ({ first_name, last_name, email, mobile, password, role }) => {
  const errors = {}

  if (!first_name?.trim()) errors.first_name = 'First name is required'
  if (!last_name?.trim()) errors.last_name = 'Last name is required'

  if (!email?.trim()) {
    errors.email = 'Email is required'
  } else if (!email.trim().endsWith('@gmail.com')) {
    errors.email = 'Email must be a @gmail.com address'
  }

  if (!mobile?.trim()) {
    errors.mobile = 'Mobile number is required'
  } else if (!/^0\d{9}$/.test(mobile.trim())) {
    errors.mobile = 'Mobile must be 10 digits and start with 0'
  }

  if (!password?.trim()) {
    errors.password = 'Password is required'
  } else if (password.trim().length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!role?.trim()) {
    errors.role = 'Role is required'
  } else if (!['super_admin', 'admin', 'user'].includes(role.trim())) {
    errors.role = 'Role must be super_admin, admin or user'
  }

  return errors
}

// ── CREATE USER ──
export const handleCreateUser = async (data) => {
  const { first_name, last_name, email, mobile, password, role } = data || {}

  const errors = validateUserFields({ first_name, last_name, email, mobile, password, role })
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() })
    if (existingUser) {
      return { success: false, fieldErrors: { email: 'An account with this email already exists' } }
    }

    const existingMobile = await User.findOne({ mobile: mobile.trim() })
    if (existingMobile) {
      return { success: false, fieldErrors: { mobile: 'An account with this mobile number already exists' } }
    }

    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS)

    const newUser = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password: hashedPassword,
      role: role.trim()
    })

    return {
      success: true,
      message: 'User created successfully',
      user: serializeUser(newUser)
    }
  } catch (error) {
    console.error('Create user error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ── GET ALL USERS ──
export const handleGetAllUsers = async () => {
  try {
    const users = await User.find({}, {
      password: 0,
      reset_otp: 0,
      reset_otp_expires_at: 0
    })
      .lean()
      .sort({ createdAt: -1 })

    return { success: true, users: users.map(serializeUser) }
  } catch (error) {
    console.error('Get all users error:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

// ── GET USER BY ID ──
export const handleGetUserById = async (id) => {
  if (!id) {
    return { success: false, error: 'User ID is required' }
  }

  try {
    const user = await User.findById(id, {
      password: 0,
      reset_otp: 0,
      reset_otp_expires_at: 0
    }).lean()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, user: serializeUser(user) }
  } catch (error) {
    console.error('Get user by id error:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

// ── UPDATE USER ──
export const handleUpdateUser = async (data) => {
  const { id, first_name, last_name, email, mobile, role } = data || {}

  if (!id) {
    return { success: false, error: 'User ID is required' }
  }

  const errors = validateUserFields({
    first_name,
    last_name,
    email,
    mobile,
    password: 'placeholder',
    role
  })
  delete errors.password

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: id } })
    if (existingEmail) {
      return { success: false, fieldErrors: { email: 'An account with this email already exists' } }
    }

    const existingMobile = await User.findOne({ mobile: mobile.trim(), _id: { $ne: id } })
    if (existingMobile) {
      return { success: false, fieldErrors: { mobile: 'An account with this mobile number already exists' } }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        role: role.trim()
      },
      { new: true, runValidators: true }
    ).lean()

    if (!updatedUser) {
      return { success: false, error: 'User not found' }
    }

    return {
      success: true,
      message: 'User updated successfully',
      user: serializeUser(updatedUser)
    }
  } catch (error) {
    console.error('Update user error:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

// ── DELETE USER ──
export const handleDeleteUser = async (id) => {
  if (!id) {
    return { success: false, error: 'User ID is required' }
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id)
    if (!deletedUser) {
      return { success: false, error: 'User not found' }
    }
    return { success: true, message: 'User deleted successfully' }
  } catch (error) {
    console.error('Delete user error:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

// ── UNLOCK USER (super admin only) ──
export const handleUnlockUser = async (id) => {
  if (!id) {
    return { success: false, error: 'User ID is required' }
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    return await user.unlockUser()
  } catch (error) {
    console.error('Unlock user error:', error)
    return { success: false, error: 'Failed to unlock user' }
  }
}
