import { Units } from '../../models/unitsModel'

const toPlain = (doc) => {
  if (!doc) return null
  return JSON.parse(JSON.stringify(doc))
}

export const createUnit = async (data) => {
  try {
    const { unitName, shortName } = data ?? {}
    if (!unitName?.trim()) return { success: false, message: 'Unit name is required' }

    const existing = await Units.findOne({ unitName: { $regex: `^${unitName.trim()}$`, $options: 'i' } }).lean()
    if (existing) return { success: false, message: 'Unit already exists' }

    const created = await Units.create({ unitName: unitName.trim(), shortName: shortName ?? '' })
    return { success: true, data: toPlain(created) }
  } catch (err) {
    console.error('createUnit error:', err)
    return { success: false, message: err.message }
  }
}

export const getUnits = async (filters = {}) => {
  try {
    if (filters.id) {
      const u = await Units.findById(filters.id).lean()
      if (!u) return { success: false, message: 'Unit not found' }
      return { success: true, data: toPlain(u) }
    }

    const list = await Units.find().sort({ createdAt: -1 }).lean()
    return { success: true, data: list.map(toPlain) }
  } catch (err) {
    console.error('getUnits error:', err)
    return { success: false, message: err.message }
  }
}

export const updateUnit = async (data) => {
  try {
    const { id, unitName, shortName } = data ?? {}
    if (!id) return { success: false, message: 'Unit ID is required' }

    const existing = await Units.findById(id)
    if (!existing) return { success: false, message: 'Unit not found' }

    if (unitName !== undefined) {
      if (!unitName?.trim()) return { success: false, message: 'Unit name cannot be empty' }
      const duplicate = await Units.findOne({ _id: { $ne: id }, unitName: { $regex: `^${unitName.trim()}$`, $options: 'i' } }).lean()
      if (duplicate) return { success: false, message: 'Unit already exists' }
      existing.unitName = unitName.trim()
    }

    if (shortName !== undefined) existing.shortName = shortName

    const updated = await existing.save()
    return { success: true, data: toPlain(updated) }
  } catch (err) {
    console.error('updateUnit error:', err)
    return { success: false, message: err.message }
  }
}

export const deleteUnit = async ({ id }) => {
  try {
    if (!id) return { success: false, message: 'Unit ID is required' }
    const u = await Units.findByIdAndDelete(id).lean()
    if (!u) return { success: false, message: 'Unit not found' }
    return { success: true, message: 'Unit deleted' }
  } catch (err) {
    console.error('deleteUnit error:', err)
    return { success: false, message: err.message }
  }
}
