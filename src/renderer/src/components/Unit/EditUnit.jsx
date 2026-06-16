import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnitHooks } from '../../hooks/unitHooks'

const EditUnit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getUnitById, updateUnit, loading, error, fieldErrors } = useUnitHooks()

  const [form, setForm] = useState({
    unitName:  '',
    shortName: '',
    unitType:  'quantity',
    subUnit: {
      shortName:        '',
      conversionFactor: ''
    }
  })

  useEffect(() => {
    const load = async () => {
      const res = await getUnitById(id)
      if (res?.success && res.data) {
        setForm({
          unitName:  res.data.unitName  || '',
          shortName: res.data.shortName || '',
          unitType:  res.data.unitType  || 'quantity',
          subUnit: {
            shortName:        res.data.subUnit?.shortName        ?? '',
            conversionFactor: res.data.subUnit?.conversionFactor ?? ''
          }
        })
      }
    }
    load()
  }, [id, getUnitById])

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubUnitChange = (e) =>
    setForm((f) => ({
      ...f,
      subUnit: { ...f.subUnit, [e.target.name]: e.target.value }
    }))

  const handleRemoveSubUnit = () =>
    setForm((f) => ({ ...f, subUnit: { shortName: '', conversionFactor: '' } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await updateUnit({ id, ...form })
    if (res?.success) navigate('/dashboard/products/units')
  }

  // Live preview
  const parentLabel = form.shortName?.trim() || form.unitName?.trim() || '—'
  const subLabel    = form.subUnit.shortName?.trim()
  const subFactor   = Number(form.subUnit.conversionFactor)
  const showPreview = subLabel && subFactor > 0

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Unit</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update unit details</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="max-w-lg">
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            {/* ── Base unit ── */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name <span className="text-red-500">*</span>
              </label>
              <input
                name="unitName"
                value={form.unitName}
                onChange={handleChange}
                placeholder="e.g. Kilogram"
                className="w-full border-2 border-gray-300 focus:border-[#1a6b7a] focus:outline-none rounded-lg p-2.5 text-sm"
              />
              {fieldErrors?.unitName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.unitName}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol / Short Name
              </label>
              <input
                name="shortName"
                value={form.shortName}
                onChange={handleChange}
                placeholder="e.g. KG"
                className="w-full border-2 border-gray-300 focus:border-[#1a6b7a] focus:outline-none rounded-lg p-2.5 text-sm"
              />
            </div>

            {/* ── Unit Type ── */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {[
                  { val: 'quantity',   label: 'Quantity',   desc: 'Counted in whole units (e.g. pieces, boxes)' },
                  { val: 'measurable', label: 'Measurable', desc: 'Sold by weight or volume (e.g. kg, L)' }
                ].map(({ val, label, desc }) => (
                  <label
                    key={val}
                    className={`flex items-start gap-3 cursor-pointer border-2 rounded-xl px-4 py-3 flex-1 transition-colors ${
                      form.unitType === val
                        ? 'border-[#1a6b7a] bg-[#f0f9fb]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="unitType"
                      value={val}
                      checked={form.unitType === val}
                      onChange={handleChange}
                      className="mt-0.5 accent-[#1a6b7a] w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {fieldErrors?.unitType && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.unitType}</p>
              )}
            </div>

            {/* ── Sub-unit ── */}
            <div className={`border-2 border-dashed rounded-xl p-5 mb-6 transition-colors ${
              form.unitType === 'quantity'
                ? 'border-gray-100 bg-gray-50 opacity-50 pointer-events-none select-none'
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-700">
                  Sub-unit <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </p>
                {(form.subUnit.shortName || form.subUnit.conversionFactor) && (
                  <button
                    type="button"
                    onClick={handleRemoveSubUnit}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    <i className="fas fa-times mr-1" />
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Only available for <span className="font-medium">Measurable</span> units — e.g. grams for Kilogram.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Sub-unit Symbol
                  </label>
                  <input
                    name="shortName"
                    value={form.subUnit.shortName}
                    onChange={handleSubUnitChange}
                    placeholder="e.g. g"
                    className="w-full border-2 border-gray-300 focus:border-[#1a6b7a] focus:outline-none rounded-lg p-2.5 text-sm"
                  />
                  {fieldErrors?.['subUnit.shortName'] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors['subUnit.shortName']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    How many sub-units = 1 {parentLabel}?
                  </label>
                  <input
                    name="conversionFactor"
                    type="number"
                    min="0.000001"
                    step="any"
                    value={form.subUnit.conversionFactor}
                    onChange={handleSubUnitChange}
                    placeholder="e.g. 1000"
                    className="w-full border-2 border-gray-300 focus:border-[#1a6b7a] focus:outline-none rounded-lg p-2.5 text-sm"
                  />
                  {fieldErrors?.['subUnit.conversionFactor'] && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors['subUnit.conversionFactor']}</p>
                  )}
                </div>
              </div>

              {/* Live preview */}
              {showPreview && (
                <div className="mt-4 flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
                  <i className="fas fa-circle-info text-[#1a6b7a] text-xs" />
                  <p className="text-sm text-[#1a6b7a] font-medium">
                    1 {parentLabel} = {subFactor.toLocaleString()} {subLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a6b7a] text-white px-6 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Update Unit'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/products/units')}
                className="bg-white border-2 border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditUnit
