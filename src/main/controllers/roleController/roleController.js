import { Role } from '../../models/roleModel'

const normalizeRoleName = (value) => value?.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const serializeRole = (role) => {
  if (!role) return null

  const plain = typeof role.toObject === 'function' ? role.toObject() : role

  return {
    ...plain,
    _id: plain?._id?.toString ? plain._id.toString() : plain?._id,
    createdAt: plain?.createdAt?.toString ? plain.createdAt.toString() : plain?.createdAt,
    updatedAt: plain?.updatedAt?.toString ? plain.updatedAt.toString() : plain?.updatedAt
  }
}

const validateRoleFields = ({ name, permissions }) => {
  const errors = {}

  if (!name?.trim()) {
    errors.name = 'Role name is required'
  } else if (normalizeRoleName(name) === 'superadmin') {
    errors.name = 'Role name "superAdmin" is not approved'
  }

  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
    errors.permissions = 'Permissions are required'
  }

  return errors
}

export const handleGetAllRoles = async () => {
  try {
    const roles = await Role.find({}).sort({ createdAt: -1 }).lean()
    return { success: true, roles: roles.map(serializeRole) }
  } catch (error) {
    console.error('Get all roles error:', error)
    return { success: false, error: 'Failed to fetch roles' }
  }
}

export const handleCreateRole = async (data) => {
  const { name, description, permissions } = data || {}
  const errors = validateRoleFields({ name, permissions })

  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingRole = await Role.findOne({ name: name.trim() })
    if (existingRole) {
      return { success: false, fieldErrors: { name: 'A role with this name already exists' } }
    }

    const role = await Role.create({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      permissions
    })

    return {
      success: true,
      message: 'Role created successfully',
      role: serializeRole(role)
    }
  } catch (error) {
    console.error('Create role error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    return { success: false, error: 'Failed to create role' }
  }
}

export const handleUpdateRole = async (data) => {
  const { id, name, description, permissions } = data || {}

  if (!id) {
    return { success: false, error: 'Role ID is required' }
  }

  const errors = validateRoleFields({ name, permissions })
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  try {
    const existingRole = await Role.findOne({ name: name.trim(), _id: { $ne: id } })
    if (existingRole) {
      return { success: false, fieldErrors: { name: 'A role with this name already exists' } }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        permissions
      },
      { new: true, runValidators: true }
    )

    if (!updatedRole) {
      return { success: false, error: 'Role not found' }
    }

    return {
      success: true,
      message: 'Role updated successfully',
      role: serializeRole(updatedRole)
    }
  } catch (error) {
    console.error('Update role error:', error)
    if (error.name === 'ValidationError') {
      const fieldErrors = {}
      Object.keys(error.errors).forEach((key) => {
        fieldErrors[key] = error.errors[key].message
      })
      return { success: false, fieldErrors }
    }
    return { success: false, error: 'Failed to update role' }
  }
}

export const handleDeleteRole = async (id) => {
  if (!id) {
    return { success: false, error: 'Role ID is required' }
  }

  try {
    const deletedRole = await Role.findByIdAndDelete(id)
    if (!deletedRole) {
      return { success: false, error: 'Role not found' }
    }

    return { success: true, message: 'Role deleted successfully' }
  } catch (error) {
    console.error('Delete role error:', error)
    return { success: false, error: 'Failed to delete role' }
  }
}