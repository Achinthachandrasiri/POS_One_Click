import mongoose from 'mongoose'

const brandsSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true
    },
    image: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'brands'
  }
)

export const Brands = mongoose.model('Brands', brandsSchema)
