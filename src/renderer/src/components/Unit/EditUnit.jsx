import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnitHooks } from '../../hooks/unitHooks'

const EditUnit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getUnitById, updateUnit, loading, error, fieldErrors } = useUnitHooks()
  const [form, setForm] = useState({ unitName: '', shortName: '' })

  useEffect(() => {
    const load = async () => {
      const res = await getUnitById(id)
      if (res?.success && res.data) {
        setForm({ unitName: res.data.unitName || '', shortName: res.data.shortName || '' })
      }
    }
    load()
  }, [id, getUnitById])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { id, unitName: form.unitName, shortName: form.shortName }
    const res = await updateUnit(payload)
    if (res?.success) navigate('/dashboard/products/units')
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Unit</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update unit details</p>
        </div>

        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
          <form onSubmit={handleSubmit} className="max-w-lg">
            {error && <p className="text-red-600 mb-2">{error}</p>}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
              <input name="unitName" value={form.unitName} onChange={handleChange} className="w-full border p-2 rounded" />
              {fieldErrors?.unitName && <p className="text-red-600 text-xs mt-1">{fieldErrors.unitName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name (optional)</label>
              <input name="shortName" value={form.shortName} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-[#1a6b7a] text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Update'}</button>
              <button type="button" onClick={() => navigate('/dashboard/products/units')} className="bg-white border px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditUnit
