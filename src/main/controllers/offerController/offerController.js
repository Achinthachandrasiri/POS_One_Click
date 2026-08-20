import { Offer } from '../../models/offerModel'

const sessionError = () => ({
  success: false,
  error: 'Your session has expired. Please log in again.'
})

const todayStr = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

const serialize = (value) => JSON.parse(JSON.stringify(value))

const validateOffer = (data) => {
  const fieldErrors = {}
  const offerName = String(data?.offer_name || '').trim()
  const percentage = Number(data?.percentage)

  if (!offerName) {
    fieldErrors.offer_name = 'Offer name is required'
  }

  if (data?.percentage === undefined || data?.percentage === null || data.percentage === '') {
    fieldErrors.percentage = 'Percentage is required'
  } else if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
    fieldErrors.percentage = 'Percentage must be between 0 and 100'
  }

  if (data?.end_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.end_date) || Number.isNaN(Date.parse(data.end_date))) {
      fieldErrors.end_date = 'Enter a valid end date'
    } else if (data.end_date < todayStr()) {
      fieldErrors.end_date = 'End date cannot be before today'
    }
  }

  return { fieldErrors, offerName, percentage }
}

const populateOffer = (query) => query.populate('created_by', 'first_name last_name email role')

const handleCreateOffer = async (data) => {
  const { created_by } = data || {}
  if (!created_by) return sessionError()

  const { fieldErrors, offerName, percentage } = validateOffer(data)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const offer = await Offer.create({
      offer_name: offerName,
      percentage,
      end_date: data.end_date || '',
      created_by
    })

    return { success: true, offer: serialize(await populateOffer(Offer.findById(offer._id))) }
  } catch (error) {
    console.error('Create offer error:', error)
    return { success: false, error: 'Failed to save the offer. Please try again.' }
  }
}

const handleGetAllOffers = async (data = {}) => {
  try {
    const filter = data.includeDeleted ? { deletedAt: { $ne: null } } : { deletedAt: null }
    const offers = await populateOffer(Offer.find(filter).sort({ createdAt: -1 }))
    return { success: true, offers: serialize(offers) }
  } catch (error) {
    console.error('Get offers error:', error)
    return { success: false, error: 'Failed to load offers.' }
  }
}

const handleGetOfferById = async (data) => {
  const { id } = data || {}
  if (!id) return { success: false, error: 'Offer id is required' }

  try {
    const offer = await populateOffer(Offer.findOne({ _id: id, deletedAt: null }))
    if (!offer) return { success: false, error: 'Offer not found' }
    return { success: true, offer: serialize(offer) }
  } catch (error) {
    console.error('Get offer by id error:', error)
    return { success: false, error: 'Failed to load this offer.' }
  }
}

const handleUpdateOffer = async (data) => {
  const { _id } = data || {}
  if (!_id) return { success: false, error: 'Offer id is required' }

  const { fieldErrors, offerName, percentage } = validateOffer(data)
  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors }
  }

  try {
    const offer = await Offer.findOne({ _id, deletedAt: null })
    if (!offer) return { success: false, error: 'Offer not found' }

    offer.offer_name = offerName
    offer.percentage = percentage
    offer.end_date = data.end_date || ''
    await offer.save()

    return { success: true, offer: serialize(await populateOffer(Offer.findById(offer._id))) }
  } catch (error) {
    console.error('Update offer error:', error)
    return { success: false, error: 'Failed to update the offer. Please try again.' }
  }
}

const handleDeleteOffer = async (data) => {
  const { id } = data || {}
  if (!id) return { success: false, error: 'Offer id is required' }

  try {
    const offer = await Offer.findOne({ _id: id, deletedAt: null })
    if (!offer) return { success: false, error: 'Offer not found' }

    offer.deletedAt = new Date()
    await offer.save()
    return { success: true }
  } catch (error) {
    console.error('Delete offer error:', error)
    return { success: false, error: 'Failed to delete the offer.' }
  }
}

export {
  handleCreateOffer,
  handleGetAllOffers,
  handleGetOfferById,
  handleUpdateOffer,
  handleDeleteOffer
}
