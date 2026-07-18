// Small helper around the localStorage session written by useLogin.js
// Import getCurrentUser() wherever you need to attribute an action
// to the logged-in user (e.g. added_by on an Expense).

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error('Failed to read current user from localStorage:', err)
    return null
  }
}

export const getCurrentUserId = () => {
  const user = getCurrentUser()
  return user?._id || user?.id || null
}

export const getAuthToken = () => localStorage.getItem('token') || ''

export const clearSession = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}
