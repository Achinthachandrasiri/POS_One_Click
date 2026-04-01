import bcrypt from 'bcryptjs'
import { User } from '../../models/userModel'

// ── CONSTANTS ──
const SALT_ROUNDS = 10

// ── VALIDATION HELPER ──
const validateUserFields = ({ first_name, last_name, email, mobile, password, role }) => {
  const errors = {}

  // First name
  if (!first_name?.trim()) {
    errors.first_name = 'First name is required'
  }

  // Last name
  if (!last_name?.trim()) {
    errors.last_name = 'Last name is required'
  }

  // Email
  if (!email?.trim()) {
    errors.email = 'Email is required'
  } else if (!email.trim().endsWith('@gmail.com')) {
    errors.email = 'Email must be a @gmail.com address'
  }

  // Mobile
  if (!mobile?.trim()) {
    errors.mobile = 'Mobile number is required'
  } else if (!/^0\d{9}$/.test(mobile.trim())) {
    errors.mobile = 'Mobile must be 10 digits and start with 0'
  }

  // Password
  if (!password?.trim()) {
    errors.password = 'Password is required'
  } else if (password.trim().length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  // Role
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

  // Validate fields
  const errors = validateUserFields({ first_name, last_name, email, mobile, password, role })

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    // Check duplicate email
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() })
    if (existingUser) {
      return {
        success: false,
        fieldErrors: { email: 'An account with this email already exists' }
      }
    }

    // Check duplicate mobile
    const existingMobile = await User.findOne({ mobile: mobile.trim() })
    if (existingMobile) {
      return {
        success: false,
        fieldErrors: { mobile: 'An account with this mobile number already exists' }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS)

    // Create user
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
      user: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    }
  } catch (error) {
    console.error('Create user error:', error)

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

// ── GET ALL USERS ──
export const handleGetAllUsers = async () => {
  try {
    const users = await User.find({}, {
      password: 0,
      reset_otp: 0,
      reset_otp_expires_at: 0
    }).sort({ createdAt: -1 })

    return { success: true, users }

  } catch (error) {
    console.error('Get all users error:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

// ── GET USER BY ID ──
export const handleGetUserById = async (id) => {
  try {
    const user = await User.findById(id, {
      password: 0,
      reset_otp: 0,
      reset_otp_expires_at: 0
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, user }
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

  // Validate fields (password not required for update)
  const errors = validateUserFields({
    first_name,
    last_name,
    email,
    mobile,
    password: 'placeholder',
    role
  })

  // Remove password error since it's not being updated here
  delete errors.password

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    // Check duplicate email (exclude current user)
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: id }
    })
    if (existingEmail) {
      return {
        success: false,
        fieldErrors: { email: 'An account with this email already exists' }
      }
    }

    // Check duplicate mobile (exclude current user)
    const existingMobile = await User.findOne({
      mobile: mobile.trim(),
      _id: { $ne: id }
    })
    if (existingMobile) {
      return {
        success: false,
        fieldErrors: { mobile: 'An account with this mobile number already exists' }
      }
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
    )

    if (!updatedUser) {
      return { success: false, error: 'User not found' }
    }

    return {
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role
      }
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
