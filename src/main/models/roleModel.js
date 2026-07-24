import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Permissions are required'],
      default: {}
    }
  },
  {
    timestamps: true
  }
)

export const Role = mongoose.model('Role', roleSchema)