import mongoose from 'mongoose'
import crypto from 'crypto'

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true
    },

    store_key: {
      type: String,
      required: [true, 'Store key is required'],   
      unique: true,
      trim: true
    },

    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'stores'
  }
)

export const Store = mongoose.model('Store', storeSchema)
