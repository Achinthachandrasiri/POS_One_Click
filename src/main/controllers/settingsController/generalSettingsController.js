import { GeneralSettings } from '../../models/generalSettingsModel'

const serialize = (doc) => ({
  ...doc.toObject(),
  _id: doc._id.toString(),
  default_store: doc.default_store?.toString()
})

export const handleGetGeneralSettings = async () => {
  try {
    const settings = await GeneralSettings.findOne().sort({ createdAt: -1 })
    if (!settings) return { success: false, error: 'General settings not found' }
    return { success: true, data: serialize(settings) }
  } catch (error) {
    console.error('handleGetGeneralSettings error:', error)
    return { success: false, error: 'Failed to fetch general settings' }
  }
}

export const handleSaveGeneralSettings = async ({
  company_name,
  email,
  default_store,
  hotline,
  mobile,
  address
}) => {
  if (!company_name || company_name.trim() === '') {
    return { success: false, error: 'Company name is required' }
  }
  if (!email || email.trim() === '') {
    return { success: false, error: 'Email is required' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { success: false, error: 'Enter a valid email address' }
  }
  if (!default_store) {
    return { success: false, error: 'Default store is required' }
  }
  if (!hotline || hotline.trim() === '') {
    return { success: false, error: 'Hotline is required' }
  }
  if (!mobile || mobile.trim() === '') {
    return { success: false, error: 'Mobile is required' }
  }
  if (!address || address.trim() === '') {
    return { success: false, error: 'Address is required' }
  }

  try {
    // Upsert — only one general settings document ever exists
    const settings = await GeneralSettings.findOneAndUpdate(
      {},
      {
        company_name: company_name.trim(),
        email: email.trim().toLowerCase(),
        default_store,
        hotline: hotline.trim(),
        mobile: mobile.trim(),
        address: address.trim()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )
    return { success: true, data: serialize(settings) }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message)
      return { success: false, error: messages.join(', ') }
    }
    console.error('handleSaveGeneralSettings error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}