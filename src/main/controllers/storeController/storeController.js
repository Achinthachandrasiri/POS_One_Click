import { Store } from '../../models/storeModel'

const serialize = (store) => ({
  ...store.toObject(),
  _id: store._id.toString()
})

export const handleCreateStore = async ({ name, store_key, is_active }) => {
  if (!name || name.trim() === '') {
    return { success: false, error: 'Store name is required' }
  }
  if (!store_key || store_key.trim() === '') {
    return { success: false, error: 'Store key is required' }
  }

  try {
    const store = new Store({
      name: name.trim(),
      store_key: store_key.trim(),
      is_active: is_active ?? true
    })
    await store.save()
    return { success: true, data: serialize(store) }

  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Store key already exists.' }
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message)
      return { success: false, error: messages.join(', ') }
    }
    console.error('handleCreateStore error:', error)
    return { success: false, error: 'Something went wrong' }
  }
}

export const handleGetAllStores = async () => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 })
    return { success: true, data: stores.map(serialize) }
  } catch (error) {
    console.error('handleGetAllStores error:', error)
    return { success: false, error: 'Failed to fetch stores' }
  }
}

export const handleGetStoreById = async (id) => {
  try {
    const store = await Store.findById(id)
    if (!store) return { success: false, error: 'Store not found' }
    return { success: true, data: serialize(store) }
  } catch (error) {
    console.error('handleGetStoreById error:', error)
    return { success: false, error: 'Failed to fetch store' }
  }
}

export const handleUpdateStore = async ({ id, name, store_key, is_active }) => {
  if (!name || name.trim() === '') {
    return { success: false, error: 'Store name is required' }
  }
  if (!store_key || store_key.trim() === '') {
    return { success: false, error: 'Store key is required' }
  }

  try {
    const store = await Store.findById(id)
    if (!store) return { success: false, error: 'Store not found' }

    store.name = name.trim()
    store.store_key = store_key.trim()
    if (typeof is_active === 'boolean') store.is_active = is_active

    await store.save()
    return { success: true, data: serialize(store) }

  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Store key already exists.' }
    }
    console.error('handleUpdateStore error:', error)
    return { success: false, error: 'Failed to update store' }
  }
}

export const handleDeleteStore = async (id) => {
  try {
    const store = await Store.findByIdAndDelete(id)
    if (!store) return { success: false, error: 'Store not found' }
    return { success: true, message: 'Store deleted successfully' }
  } catch (error) {
    console.error('handleDeleteStore error:', error)
    return { success: false, error: 'Failed to delete store' }
  }
}
