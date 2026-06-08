import { Variations } from '../../models/variationModel'

const toPlain = (doc) => {
  if (!doc) return null
  return JSON.parse(JSON.stringify(doc))
}

export const createVariation = async (data) => {
  try {
    const { variationName, types } = data ?? {}
    if (!variationName?.trim()) return { success: false, message: 'Variation name is required' }

    const existing = await Variations.findOne({ variationName: { $regex: `^${variationName.trim()}$`, $options: 'i' } }).lean()
    if (existing) return { success: false, message: 'Variation already exists' }

    const created = await Variations.create({ variationName: variationName.trim(), types: types ?? '' })
    return { success: true, data: toPlain(created) }
  } catch (err) {
    console.error('createVariation error:', err)
    return { success: false, message: err.message }
  }
}

export const getVariations = async (filters = {}) => {
  try {
    if (filters.id) {
      const v = await Variations.findById(filters.id).lean()
      if (!v) return { success: false, message: 'Variation not found' }
      return { success: true, data: toPlain(v) }
    }

    const list = await Variations.find().sort({ createdAt: -1 }).lean()
    return { success: true, data: list.map(toPlain) }
  } catch (err) {
    console.error('getVariations error:', err)
    return { success: false, message: err.message }
  }
}

export const updateVariation = async (data) => {
  try {
    const { id, variationName, types } = data ?? {}
    if (!id) return { success: false, message: 'Variation ID is required' }

    const existing = await Variations.findById(id)
    if (!existing) return { success: false, message: 'Variation not found' }

    if (variationName !== undefined) {
      if (!variationName?.trim()) return { success: false, message: 'Variation name cannot be empty' }
      const duplicate = await Variations.findOne({ _id: { $ne: id }, variationName: { $regex: `^${variationName.trim()}$`, $options: 'i' } }).lean()
      if (duplicate) return { success: false, message: 'Variation already exists' }
      existing.variationName = variationName.trim()
    }

    if (types !== undefined) existing.types = types

    const updated = await existing.save()
    return { success: true, data: toPlain(updated) }
  } catch (err) {
    console.error('updateVariation error:', err)
    return { success: false, message: err.message }
  }
}

export const deleteVariation = async ({ id }) => {
  try {
    if (!id) return { success: false, message: 'Variation ID is required' }
    const v = await Variations.findByIdAndDelete(id).lean()
    if (!v) return { success: false, message: 'Variation not found' }
    return { success: true, message: 'Variation deleted' }
  } catch (err) {
    console.error('deleteVariation error:', err)
    return { success: false, message: err.message }
  }
}
