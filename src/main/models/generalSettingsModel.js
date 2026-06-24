import mongoose from 'mongoose'

const generalSettingsSchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    default_store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Default store is required']
    },
    hotline: {
      type: String,
      required: [true, 'Hotline is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'general_settings'
  }
)

export const GeneralSettings = mongoose.model('GeneralSettings', generalSettingsSchema)