import mongoose from 'mongoose'

const variationSchema = new mongoose.Schema(
  {
    variationName: {
      type: String,
      required: [true, 'Variation name is required'],
      trim: true
    },
    types: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'variations'
  }
)

export const Variations = mongoose.model('Variations', variationSchema)
