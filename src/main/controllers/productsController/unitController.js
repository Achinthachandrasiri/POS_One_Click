import { Units } from '../../models/unitsModel'

const toPlain = (doc) => {
  if (!doc) return null
  return JSON.parse(JSON.stringify(doc))
}

// Validate and normalise the optional subUnit payload.
// Returns { subUnit } on success or { error } on failure.
const parseSubUnit = (subUnit) => {
  if (!subUnit) return { subUnit: null }

  const shortName = subUnit.shortName?.trim()
  const conversionFactor = Number(subUnit.conversionFactor)

  if (!shortName) return { error: 'Sub-unit symbol is required' }
  if (!conversionFactor || conversionFactor <= 0)
    return { error: 'Conversion factor must be a positive number' }

  return { subUnit: { shortName, conversionFactor } }
}

export const createUnit = async (data) => {
  try {
    const { unitName, shortName, unitType, subUnit: rawSubUnit } = data ?? {}
    if (!unitName?.trim()) return { success: false, message: 'Unit name is required' }
    if (!unitType || !['quantity', 'measurable'].includes(unitType))
      return { success: false, message: 'Unit type must be either "quantity" or "measurable"' }

    const existing = await Units.findOne({
      unitName: { $regex: `^${unitName.trim()}$`, $options: 'i' }
    }).lean()
    if (existing) return { success: false, message: 'Unit already exists' }

    const { subUnit, error } = parseSubUnit(rawSubUnit)
    if (error) return { success: false, message: error }

    const created = await Units.create({
      unitName: unitName.trim(),
      shortName: shortName ?? '',
      unitType,
      subUnit
    })
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
    const { id, unitName, shortName, unitType, subUnit: rawSubUnit } = data ?? {}
    if (!id) return { success: false, message: 'Unit ID is required' }

    const existing = await Units.findById(id)
    if (!existing) return { success: false, message: 'Unit not found' }

    if (unitName !== undefined) {
      if (!unitName?.trim()) return { success: false, message: 'Unit name cannot be empty' }
      const duplicate = await Units.findOne({
        _id: { $ne: id },
        unitName: { $regex: `^${unitName.trim()}$`, $options: 'i' }
      }).lean()
      if (duplicate) return { success: false, message: 'Unit already exists' }
      existing.unitName = unitName.trim()
    }

    if (shortName !== undefined) existing.shortName = shortName

    if (unitType !== undefined) {
      if (!['quantity', 'measurable'].includes(unitType))
        return { success: false, message: 'Unit type must be either "quantity" or "measurable"' }
      existing.unitType = unitType
    }

    // rawSubUnit === null  → caller explicitly wants to remove the sub-unit
    // rawSubUnit === undefined → leave unchanged (not sent by caller)
    if (rawSubUnit !== undefined) {
      if (rawSubUnit === null) {
        existing.subUnit = null
      } else {
        const { subUnit, error } = parseSubUnit(rawSubUnit)
        if (error) return { success: false, message: error }
        existing.subUnit = subUnit
      }
    }

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
