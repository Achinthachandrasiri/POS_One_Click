import { useState, useCallback } from 'react'
import { getCurrentUser } from '../utils/session'

const STORAGE_KEY = 'pos:offers'

const readOffers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to read offers from localStorage:', err)
    return []
  }
}

const writeOffers = (offers) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers))
}

const normalizeId = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (v.$oid) return v.$oid
    if (typeof v.toString === 'function') return v.toString()
  }
  return String(v)
}

const isBlank = (v) => !v || !String(v).trim()

const validateOfferPayload = (data) => {
  const errors = {}

  if (isBlank(data.offer_name)) {
    errors.offer_name = 'Offer name is required'
  }

  const percent = Number(data.percentage)
  if (Number.isNaN(percent)) {
    errors.percentage = 'Percentage is required'
  } else if (percent < 0 || percent > 100) {
    errors.percentage = 'Percentage must be between 0 and 100'
  }

  if (data.end_date) {
    const ts = Date.parse(data.end_date)
    if (Number.isNaN(ts)) {
      errors.end_date = 'Enter a valid end date'
    }
  }

  return errors
}

const getCreatedByLabel = () => {
  const user = getCurrentUser()
  return user?.email || user?.username || user?.first_name || 'Unknown user'
}

export const useOfferHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getAllOffers = useCallback(async ({ includeDeleted = false } = {}) => {
    setLoading(true)
    setError('')

    try {
      const offers = readOffers()
      const filtered = includeDeleted ? offers.filter((o) => !!o.deletedAt) : offers.filter((o) => !o.deletedAt)
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      return { success: true, offers: filtered }
    } catch (err) {
      console.error('getAllOffers error:', err)
      setError('Failed to load offers')
      return { success: false, error: 'Failed to load offers' }
    } finally {
      setLoading(false)
    }
  }, [])

  const getOfferById = useCallback(async (id) => {
    setLoading(true)
    setError('')

    try {
      const offers = readOffers()
      const found = offers.find((o) => normalizeId(o._id) === normalizeId(id))

      if (!found) {
        const msg = 'Offer not found'
        setError(msg)
        return { success: false, error: msg }
      }

      return { success: true, offer: found }
    } catch (err) {
      console.error('getOfferById error:', err)
      setError('Failed to load offer')
      return { success: false, error: 'Failed to load offer' }
    } finally {
      setLoading(false)
    }
  }, [])

  const createOffer = useCallback(async (data) => {
    setLoading(true)
    setError('')

    try {
      const fieldErrors = validateOfferPayload(data)
      if (Object.keys(fieldErrors).length > 0) {
        return { success: false, fieldErrors }
      }

      const offers = readOffers()
      const now = new Date().toISOString()

      const newOffer = {
        _id: crypto.randomUUID(),
        offer_name: String(data.offer_name).trim(),
        percentage: Number(data.percentage),
        end_date: data.end_date || '',
        created_by: getCreatedByLabel(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }

      offers.push(newOffer)
      writeOffers(offers)

      return { success: true, offer: newOffer }
    } catch (err) {
      console.error('createOffer error:', err)
      setError('Failed to create offer')
      return { success: false, error: 'Failed to create offer' }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateOffer = useCallback(async (data) => {
    setLoading(true)
    setError('')

    try {
      const fieldErrors = validateOfferPayload(data)
      if (Object.keys(fieldErrors).length > 0) {
        return { success: false, fieldErrors }
      }

      const offers = readOffers()
      const idx = offers.findIndex((o) => normalizeId(o._id) === normalizeId(data._id))

      if (idx === -1) {
        const msg = 'Offer not found'
        setError(msg)
        return { success: false, error: msg }
      }

      offers[idx] = {
        ...offers[idx],
        offer_name: String(data.offer_name).trim(),
        percentage: Number(data.percentage),
        end_date: data.end_date || '',
        updatedAt: new Date().toISOString()
      }

      writeOffers(offers)
      return { success: true, offer: offers[idx] }
    } catch (err) {
      console.error('updateOffer error:', err)
      setError('Failed to update offer')
      return { success: false, error: 'Failed to update offer' }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteOffer = useCallback(async (id) => {
    setLoading(true)
    setError('')

    try {
      const offers = readOffers()
      const idx = offers.findIndex((o) => normalizeId(o._id) === normalizeId(id))

      if (idx === -1) {
        const msg = 'Offer not found'
        setError(msg)
        return { success: false, error: msg }
      }

      offers[idx] = {
        ...offers[idx],
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      writeOffers(offers)
      return { success: true }
    } catch (err) {
      console.error('deleteOffer error:', err)
      setError('Failed to delete offer')
      return { success: false, error: 'Failed to delete offer' }
    } finally {
      setLoading(false)
    }
  }, [])

  const restoreOffer = useCallback(async (id) => {
    setLoading(true)
    setError('')

    try {
      const offers = readOffers()
      const idx = offers.findIndex((o) => normalizeId(o._id) === normalizeId(id))

      if (idx === -1) {
        const msg = 'Offer not found'
        setError(msg)
        return { success: false, error: msg }
      }

      offers[idx] = {
        ...offers[idx],
        deletedAt: null,
        updatedAt: new Date().toISOString()
      }

      writeOffers(offers)
      return { success: true }
    } catch (err) {
      console.error('restoreOffer error:', err)
      setError('Failed to restore offer')
      return { success: false, error: 'Failed to restore offer' }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getAllOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
    restoreOffer,
    loading,
    error
  }
}
