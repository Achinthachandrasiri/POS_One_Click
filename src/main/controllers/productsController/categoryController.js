import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { Categories } from '../../models/categoriesModel'

// ─── Helpers ────────────────────────────────────────────────────────────────

const toPlain = (doc) => JSON.parse(JSON.stringify(doc))

const getUploadsDir = () => {
  const dir = path.join(app.getPath('userData'), 'uploads', 'categories')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

const saveImage = (base64) => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  const fileName = `category_${Date.now()}.jpg`
  const filePath = path.join(getUploadsDir(), fileName)
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
  return filePath
}

const deleteImageFile = (imagePath) => {
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
  } catch (err) {
    console.error('Failed to delete category image:', err)
  }
}

const isBase64 = (str) => typeof str === 'string' && str.startsWith('data:image/')

// ─── Controllers ────────────────────────────────────────────────────────────

export const createCategory = async (data) => {
  try {
    const { categoryName, image } = data

    if (!categoryName?.trim()) {
      return { success: false, message: 'Category name is required' }
    }

    // Case-insensitive duplicate check
    const existing = await Categories.findOne({
      categoryName: { $regex: `^${categoryName.trim()}$`, $options: 'i' }
    }).lean()

    if (existing) {
      return { success: false, message: 'Category already exists' }
    }

    let imagePath = ''
    if (image && isBase64(image)) {
      imagePath = saveImage(image)
    }

    const category = await Categories.create({
      categoryName: categoryName.trim(),
      image: imagePath
    })

    return { success: true, data: toPlain(category) }
  } catch (err) {
    console.error('createCategory error:', err)
    return { success: false, message: err.message }
  }
}

export const getCategories = async (filters = {}) => {
  try {
    if (filters.id) {
      const category = await Categories.findById(filters.id).lean()
      if (!category) return { success: false, message: 'Category not found' }
      return { success: true, data: toPlain(category) }
    }

    const categories = await Categories.find().lean()
    return { success: true, data: categories.map(toPlain) }
  } catch (err) {
    console.error('getCategories error:', err)
    return { success: false, message: err.message }
  }
}

export const updateCategory = async (data) => {
  try {
    const { id, categoryName, image } = data

    if (!id) return { success: false, message: 'Category ID is required' }
    if (!categoryName?.trim()) return { success: false, message: 'Category name is required' }

    // Case-insensitive duplicate check — exclude self
    const duplicate = await Categories.findOne({
      _id: { $ne: id },
      categoryName: { $regex: `^${categoryName.trim()}$`, $options: 'i' }
    }).lean()

    if (duplicate) {
      return { success: false, message: 'Category already exists' }
    }

    const existing = await Categories.findById(id).lean()
    if (!existing) return { success: false, message: 'Category not found' }

    let imagePath = existing.image // default: keep existing

    if (image === '' || image === null || image === undefined) {
      // Image removed — delete old file
      deleteImageFile(existing.image)
      imagePath = ''
    } else if (isBase64(image)) {
      // New image uploaded — delete old, save new
      deleteImageFile(existing.image)
      imagePath = saveImage(image)
    }
    // else: image is an existing file path — leave imagePath as-is

    const updated = await Categories.findByIdAndUpdate(
      id,
      { categoryName: categoryName.trim(), image: imagePath },
      { new: true }
    ).lean()

    return { success: true, data: toPlain(updated) }
  } catch (err) {
    console.error('updateCategory error:', err)
    return { success: false, message: err.message }
  }
}

export const deleteCategory = async ({ id }) => {
  try {
    if (!id) return { success: false, message: 'Category ID is required' }

    const category = await Categories.findById(id).lean()
    if (!category) return { success: false, message: 'Category not found' }

    deleteImageFile(category.image)

    await Categories.findByIdAndDelete(id)

    return { success: true, message: 'Category deleted successfully' }
  } catch (err) {
    console.error('deleteCategory error:', err)
    return { success: false, message: err.message }
  }
}
