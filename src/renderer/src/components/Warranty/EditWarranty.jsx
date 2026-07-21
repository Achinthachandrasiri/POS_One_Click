import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWarrantyTypeHooks } from '../../hooks/useWarrantyTypeHooks'

const inputCls = 'w-full border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 bg-transparent'
const selectCls = 'w-full border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 bg-transparent cursor-pointer'
const labelCls = 'text-sm font-semibold text-gray-600 mb-1 block'
const errorCls = 'text-red-600 text-xs mt-1'

const EditWarranty = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getWarrantyTypeById, updateWarrantyType, loading, error } = useWarrantyTypeHooks()

  const [form, setForm] = useState({
    warranty_name: '',
    coverage_type: '',
    terms: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const loadWarrantyType = async () => {
      const res = await getWarrantyTypeById(id)
      if (res?.success && res.warrantyType) {
        const { warranty_name, coverage_type, terms } = res.warrantyType
        setForm({
          warranty_name: warranty_name || '',
          coverage_type: coverage_type || '',
          terms: terms || ''
        })
      }
      setInitialLoading(false)
    }
    loadWarrantyType()
  }, [id])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const res = await updateWarrantyType({ _id: id, ...form })

    if (res?.success) {
      navigate('/dashboard/warranty')
      return
    }

    if (res?.fieldErrors) {
      setFieldErrors(res.fieldErrors)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Warranty</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update this warranty type</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[26px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {initialLoading ? (
            <p className="text-gray-500 text-sm">Loading warranty type...</p>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-xl">

              {error && (
                <p className="text-red-600 text-xs mb-4">{error}</p>
              )}

              {/* Warranty Name */}
              <div className="mb-4">
                <label className={labelCls}>Warranty Name</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Manufacturer Warranty"
                  value={form.warranty_name}
                  onChange={handleChange('warranty_name')}
                  className={inputCls}
                />
                {fieldErrors.warranty_name && <p className={errorCls}>{fieldErrors.warranty_name}</p>}
              </div>

              {/* Coverage Type */}
              <div className="mb-4">
                <label className={labelCls}>Coverage Type</label>
                <select
                  value={form.coverage_type}
                  onChange={handleChange('coverage_type')}
                  className={selectCls}
                >
                  <option value="">Select coverage type</option>
                  <option value="repair">Repair</option>
                  <option value="replacement">Replacement</option>
                  <option value="refund">Refund</option>
                  <option value="repair_or_replacement">Repair or Replacement</option>
                </select>
                {fieldErrors.coverage_type && <p className={errorCls}>{fieldErrors.coverage_type}</p>}
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className={labelCls}>Terms</label>
                <textarea
                  placeholder="Describe what this warranty covers, conditions, exclusions, etc."
                  value={form.terms}
                  onChange={handleChange('terms')}
                  rows={4}
                  className={inputCls}
                />
                {fieldErrors.terms && <p className={errorCls}>{fieldErrors.terms}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Update Warranty Type'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/warranty')}
                  className="border-2 border-gray-300 text-gray-600 text-md px-6 py-3 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditWarranty
