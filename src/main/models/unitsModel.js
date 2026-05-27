import mongoose from 'mongoose'

const unitsSchema = new mongoose.Schema(
  {
    unitName: {
      type: String,
      required: [true, 'Unit name is required'],
      trim: true
    },
    shortName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'units'
  }
)

export const Units = mongoose.model('Units', unitsSchema)
