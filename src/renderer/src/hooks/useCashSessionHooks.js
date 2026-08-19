import { useState } from 'react'
import { getCurrentUser } from '../utils/session'

const useCashSessionHooks = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkActiveSession = async (deviceId) => {
    setLoading(true)
    setError(null)
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        return { success: false, error: 'Session expired. Please log in again.' }
      }
      const result = await window.api.cashSession.checkActive({
        device_id: deviceId,
        user_id: currentUser.id
      })
      if (!result.success) setError(result.error)
      return result
    } catch (err) {
      const message = err.message || 'Failed to check active session'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const openSession = async ({ deviceId, deviceName, storeId, openingCash }) => {
    setLoading(true)
    setError(null)
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        return { success: false, error: 'Session expired. Please log in again.' }
      }
      const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()

      const result = await window.api.cashSession.open({
        store_id: storeId,
        device_id: deviceId,
        device_name: deviceName,
        opened_by_id: currentUser.id,
        opened_by_email: currentUser.email,
        opened_by_name: fullName,
        opening_cash: openingCash
      })
      if (!result.success) setError(result.error)
      return result
    } catch (err) {
      const message = err.message || 'Failed to open cash session'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, checkActiveSession, openSession }
}

export default useCashSessionHooks
