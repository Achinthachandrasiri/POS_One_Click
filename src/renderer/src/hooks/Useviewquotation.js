import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export const initialFilters = () => ({
  store_id: '',
  customer_id: '',
  search: '',
  from_date: '',
  to_date: ''
})

export const useViewQuotation = () => {
  const navigate = useNavigate()

  const [quotations, setQuotations] = useState([])
  const [dropdowns, setDropdowns] = useState({ stores: [], customers: [] })
  const [filters, setFilters] = useState(initialFilters())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailQuotation, setDetailQuotation] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── load store/customer dropdowns once ──
  useEffect(() => {
    const load = async () => {
      try {
        const [storesRes, customersRes] = await Promise.all([
          window.api.store.getAll(),
          window.api.customer.getAll()
        ])
        setDropdowns({
          stores: storesRes?.stores || storesRes?.data || [],
          customers: customersRes?.customers || customersRes?.data || []
        })
      } catch (e) {
        console.error('Failed to load filter dropdowns', e)
      }
    }
    load()
  }, [])

  // ── fetch quotations, re-run whenever filters change (debounced for search) ──
  const fetchQuotations = useCallback(async (activeFilters) => {
    setLoading(true)
    setError('')
    try {
      const payload = {}
      if (activeFilters.store_id) payload.store_id = activeFilters.store_id
      if (activeFilters.customer_id) payload.customer_id = activeFilters.customer_id
      if (activeFilters.search.trim()) payload.search = activeFilters.search.trim()
      if (activeFilters.from_date) payload.from_date = activeFilters.from_date
      if (activeFilters.to_date) payload.to_date = activeFilters.to_date

      const res = await window.api.quotation.getAll(payload)
      if (res?.success) {
        setQuotations(res.data || [])
      } else {
        setError(res?.message || 'Failed to load quotations.')
        setQuotations([])
      }
    } catch (e) {
      console.error('fetchQuotations failed', e)
      setError('Could not connect to the server. Please try again.')
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => fetchQuotations(filters), filters.search ? 350 : 0)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, fetchQuotations])

  const updateFilter = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }))
  const clearFilters = () => setFilters(initialFilters())

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v !== ''),
    [filters]
  )

  // ── detail modal ──
  const openDetail = async (quotation) => {
    setDetailLoading(true)
    setDetailQuotation(quotation) // show cached row data immediately
    try {
      const res = await window.api.quotation.getById(quotation._id)
      if (res?.success) setDetailQuotation(res.data)
    } catch (e) {
      console.error('Failed to load quotation detail', e)
    } finally {
      setDetailLoading(false)
    }
  }
  const closeDetail = () => setDetailQuotation(null)

  // ── edit / create navigation ──
  const goToCreate = () => navigate('/dashboard/quotation/create')
  const goToEdit = (id) => navigate(`/dashboard/quotation/edit/${id}`)

  // ── delete ──
  const requestDelete = (quotation) => setDeleteTarget(quotation)
  const cancelDelete = () => setDeleteTarget(null)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await window.api.quotation.delete(deleteTarget._id)
      if (res?.success) {
        setQuotations((prev) => prev.filter((q) => q._id !== deleteTarget._id))
        setDeleteTarget(null)
        if (detailQuotation?._id === deleteTarget._id) setDetailQuotation(null)
      } else {
        setError(res?.message || 'Failed to delete quotation.')
      }
    } catch (e) {
      console.error('confirmDelete failed', e)
      setError('Could not connect to the server. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return {
    quotations,
    dropdowns,
    filters,
    loading,
    error,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    detailQuotation,
    detailLoading,
    openDetail,
    closeDetail,
    goToCreate,
    goToEdit,
    deleteTarget,
    deleting,
    requestDelete,
    cancelDelete,
    confirmDelete
  }
}
