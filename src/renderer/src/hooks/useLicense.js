import { useState, useEffect, useCallback } from 'react'

function useLicense() {
  const [isLicensed, setIsLicensed] = useState(null)
  const [error, setError] = useState(null)

  const checkLicense = useCallback(async () => {
    try {
      const result = await window.api.license.check()
      setIsLicensed(result.success)
      setError(result.success ? null : result.error)
      return result
    } catch (err) {
      console.error('License check failed:', err)
      setIsLicensed(false)
      setError('CHECK_FAILED')
      return { success: false, error: 'CHECK_FAILED' }
    }
  }, [])

  const activateLicense = useCallback(async (key) => {
    try {
      const result = await window.api.license.activate(key)
      if (result.success) {
        setIsLicensed(true)
        setError(null)
      } else {
        setError(result.error)
      }
      return result
    } catch (err) {
      console.error('License activation failed:', err)
      setError('ACTIVATION_FAILED')
      return { success: false, error: 'ACTIVATION_FAILED' }
    }
  }, [])

  useEffect(() => {
    checkLicense()
  }, [checkLicense])

  return { isLicensed, error, activateLicense, checkLicense }
}

export default useLicense
