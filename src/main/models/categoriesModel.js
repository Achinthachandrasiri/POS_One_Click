import mongoose from 'mongoose'

const categoriesSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    image: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'categories'
  }
)

export const Categories = mongoose.model('Categories', categoriesSchema)
