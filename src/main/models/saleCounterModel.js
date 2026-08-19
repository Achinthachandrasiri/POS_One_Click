import mongoose from 'mongoose'

const { Schema } = mongoose

const SaleCounterSchema = new Schema({
  store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  date_key: { type: String, required: true },
  count: { type: Number, default: 0 }
})

SaleCounterSchema.index({ store_id: 1, date_key: 1 }, { unique: true })

export const SaleCounter = mongoose.models.SaleCounter || mongoose.model('SaleCounter', SaleCounterSchema)
