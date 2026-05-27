import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { fileURLToPath } from 'url'
import { Brands } from '../../models/brandsModel'

// ─── Helpers ────────────────────────────────────────────────────────────────

const toPlain = (doc) => {
  if (!doc) return null
  return JSON.parse(JSON.stringify(doc))
}

const buildDuplicateQuery = (brandName, excludeId = null) => {
  const query = {
    brandName: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') }
  }
  if (excludeId) {
    query._id = { $ne: excludeId }
  }
  return query
}

const getUploadsDir = () => {
  // app.getAppPath() returns the project root (where package.json is)
  const dir = path.join(app.getAppPath(), 'src/main/uploads/brands')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

const isBase64 = (str) =>
  typeof str === 'string' && str.startsWith('data:image/')

const saveImage = (base64) => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  const fileName = `brand_${Date.now()}.jpg`
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
    console.error('[deleteImageFile]', err)
  }
}

// ─── Controller ─────────────────────────────────────────────────────────────

/**
 * CREATE a new brand.
 * Expected payload: { brandName: string, image?: string (base64) }
 */
export const createBrand = async (payload) => {
  try {
    const { brandName, image } = payload ?? {}

    if (!brandName || !brandName.trim()) {
      return { success: false, message: 'Brand name is required.' }
    }

    const existing = await Brands.findOne(buildDuplicateQuery(brandName)).lean()
    if (existing) {
      return {
        success: false,
        message: `Brand "${existing.brandName}" already exists.`
      }
    }

    let imagePath = ''
    if (image && isBase64(image)) {
      imagePath = saveImage(image)
    }

    const brand = await Brands.create({
      brandName: brandName.trim(),
      ...(imagePath ? { image: imagePath } : {})
    })

    return { success: true, message: 'Brand created successfully.', data: toPlain(brand) }
  } catch (error) {
    console.error('[createBrand]', error)
    return { success: false, message: error.message ?? 'Failed to create brand.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET all brands  –or–  GET a single brand by _id.
 * Expected payload: { id?: string }
 */
export const getBrands = async (payload = {}) => {
  try {
    const { id } = payload

    if (id) {
      const brand = await Brands.findById(id).lean()
      if (!brand) {
        return { success: false, message: 'Brand not found.' }
      }
      return { success: true, data: toPlain(brand) }
    }

    const brands = await Brands.find().sort({ createdAt: -1 }).lean()
    return { success: true, data: toPlain(brands) }
  } catch (error) {
    console.error('[getBrands]', error)
    return { success: false, message: error.message ?? 'Failed to fetch brands.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * UPDATE a brand by _id.
 * Expected payload: { id: string, brandName?: string, image?: string (base64 | existing path | '') }
 */
export const updateBrand = async (payload) => {
  try {
    const { id, brandName, image } = payload ?? {}

    if (!id) {
      return { success: false, message: 'Brand ID is required.' }
    }

    const brand = await Brands.findById(id)
    if (!brand) {
      return { success: false, message: 'Brand not found.' }
    }

    if (brandName !== undefined) {
      if (!brandName.trim()) {
        return { success: false, message: 'Brand name cannot be empty.' }
      }

      const duplicate = await Brands.findOne(buildDuplicateQuery(brandName, id)).lean()
      if (duplicate) {
        return {
          success: false,
          message: `Brand "${duplicate.brandName}" already exists.`
        }
      }

      brand.brandName = brandName.trim()
    }

    if (image !== undefined) {
      if (image === '' || image === null) {
        // Image removed — delete old file
        deleteImageFile(brand.image)
        brand.image = ''
      } else if (isBase64(image)) {
        // New image uploaded — delete old file, save new
        deleteImageFile(brand.image)
        brand.image = saveImage(image)
      }
      // else: existing file path passed back unchanged — leave brand.image as-is
    }

    const updated = await brand.save()

    return { success: true, message: 'Brand updated successfully.', data: toPlain(updated) }
  } catch (error) {
    console.error('[updateBrand]', error)
    return { success: false, message: error.message ?? 'Failed to update brand.' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE a brand by _id.
 * Expected payload: { id: string }
 */
export const deleteBrand = async (payload) => {
  try {
    const { id } = payload ?? {}

    if (!id) {
      return { success: false, message: 'Brand ID is required.' }
    }

    const brand = await Brands.findByIdAndDelete(id).lean()
    if (!brand) {
      return { success: false, message: 'Brand not found.' }
    }

    deleteImageFile(brand.image)

    return { success: true, message: 'Brand deleted successfully.' }
  } catch (error) {
    console.error('[deleteBrand]', error)
    return { success: false, message: error.message ?? 'Failed to delete brand.' }
  }
}
