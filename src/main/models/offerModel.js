import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema(
  {
    offer_name: {
      type: String,
      required: [true, 'Offer name is required'],
      trim: true
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: 0,
      max: 100
    },
    end_date: {
      type: String,
      default: '',
      validate: {
        validator: (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
        message: 'End date must be in YYYY-MM-DD format'
      }
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

offerSchema.index({ deletedAt: 1, createdAt: -1 })

offerSchema.index({ created_by: 1 })

const Offer = mongoose.model('Offer', offerSchema)

export { Offer }
