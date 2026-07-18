import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServiceHooks } from '../../hooks/useServiceHooks'

const inputCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-full bg-transparent'
const selectCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 w-full bg-transparent cursor-pointer'
const labelCls = 'text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block'
const errorCls = 'text-red-600 text-sm mt-1'

const CreateService = () => {
  const navigate = useNavigate()
  const { createService, loading } = useServiceHooks()

  const [categories, setCategories] = useState([])

  const [form, setForm] = useState({
    service_name: '',
    service_code: '',
    category: '',
    description: '',
    cost: '',
    price: '',
    tax_rate: '',
    status: 'active'
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      const res = await window.api.category.getAll()
      if (res?.success) {
        setCategories(res.data || [])
      }
    }
    loadCategories()
  }, [])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errors = {}
    if (!form.service_name.trim()) errors.service_name = 'Service name is required'
    if (!form.service_code.trim()) errors.service_code = 'Service code is required'
    if (!form.category) errors.category = 'Category is required'
    if (form.cost === '' || Number(form.cost) < 0) errors.cost = 'Enter a valid cost'
    if (form.price === '' || Number(form.price) < 0) errors.price = 'Enter a valid price'
    if (form.tax_rate !== '' && Number(form.tax_rate) < 0) errors.tax_rate = 'Enter a valid tax rate'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const res = await createService({
      service_name: form.service_name.trim(),
      service_code: form.service_code.trim(),
      category: form.category,
      description: form.description.trim(),
      cost: Number(form.cost),
      price: Number(form.price),
      tax_rate: form.tax_rate === '' ? 0 : Number(form.tax_rate),
      status: form.status
    })

    if (res?.success) {
      navigate('/dashboard/services')
    } else if (res?.fieldErrors) {
      setFieldErrors(res.fieldErrors)
    } else {
      setFormError(res?.message || 'Failed to create service. Please try again.')
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
          <h1 className="text-white text-[22px] font-semibold m-0">Create Service</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Create new service records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="max-w-2xl mt-6">

            {formError && (
              <div className="mb-4 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
                <i className="fas fa-exclamation-triangle mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Haircut"
                  value={form.service_name}
                  onChange={(e) => updateField('service_name', e.target.value)}
                  className={inputCls}
                />
                {fieldErrors.service_name && <p className={errorCls}>{fieldErrors.service_name}</p>}
              </div>

              <div>
                <label className={labelCls}>Service Code</label>
                <input
                  type="text"
                  placeholder="e.g. SVC-001"
                  value={form.service_code}
                  onChange={(e) => updateField('service_code', e.target.value)}
                  className={inputCls}
                />
                {fieldErrors.service_code && <p className={errorCls}>{fieldErrors.service_code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-5">
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.categoryName}</option>
                  ))}
                </select>
                {fieldErrors.category && <p className={errorCls}>{fieldErrors.category}</p>}
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className={selectCls}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-5">
              <div>
                <label className={labelCls}>Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => updateField('cost', e.target.value)}
                  className={inputCls}
                />
                {fieldErrors.cost && <p className={errorCls}>{fieldErrors.cost}</p>}
              </div>

              <div>
                <label className={labelCls}>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  className={inputCls}
                />
                {fieldErrors.price && <p className={errorCls}>{fieldErrors.price}</p>}
              </div>
            </div>

            <div className="mt-5">
              <label className={labelCls}>Tax Rate <span className="normal-case text-gray-400 font-medium">(optional, %)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.tax_rate}
                onChange={(e) => updateField('tax_rate', e.target.value)}
                className={inputCls}
              />
              {fieldErrors.tax_rate && <p className={errorCls}>{fieldErrors.tax_rate}</p>}
            </div>

            <div className="mt-5">
              <label className={labelCls}>Description <span className="normal-case text-gray-400 font-medium">(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Any additional details…"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 mt-7">
              <button
                type="button"
                onClick={() => navigate('/dashboard/services')}
                disabled={loading}
                className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading ? (<><i className="fas fa-spinner fa-spin" /> Saving…</>) : (<><i className="fas fa-plus" /> Add Service</>)}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateService
