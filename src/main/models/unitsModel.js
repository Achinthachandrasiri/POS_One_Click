import mongoose from 'mongoose'

const subUnitSchema = new mongoose.Schema(
  {
    shortName: {
      type: String,
      required: [true, 'Sub-unit symbol is required'],
      trim: true
    },
    conversionFactor: {
      type: Number,
      required: [true, 'Conversion factor is required'],
      min: [0.000001, 'Conversion factor must be greater than 0']
    }
  },
  { _id: false }
)

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
    },
    unitType: {
      type: String,
      enum: {
        values: ['quantity', 'measurable'],
        message: 'Unit type must be either "quantity" or "measurable"'
      },
      required: [true, 'Unit type is required']
    },
    subUnit: {
      type: subUnitSchema,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'units'
  }
)

export const Units = mongoose.model('Units', unitsSchema)
