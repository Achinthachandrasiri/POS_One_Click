import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVariationHooks } from '../../hooks/variationHooks'

const CreateVariation = () => {
  const navigate = useNavigate()
  const { createVariation, loading, error, fieldErrors } = useVariationHooks()
  const [form, setForm] = useState({ variationName: '', types: '' })

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await createVariation(form)
    if (res?.success) navigate('/dashboard/products/variations')
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Create Variation</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Add a new product variation</p>
        </div>

        <div className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
          <form onSubmit={handleSubmit} className="max-w-lg">
            {error && <p className="text-red-600 mb-2">{error}</p>}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Variation Name</label>
              <input name="variationName" value={form.variationName} onChange={handleChange} className="w-full border p-2 rounded" />
              {fieldErrors?.variationName && <p className="text-red-600 text-xs mt-1">{fieldErrors.variationName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Variation Types (Comma separated)</label>
              <input name="types" value={form.types} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-[#1a6b7a] text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
              <button type="button" onClick={() => navigate('/dashboard/products/variations')} className="bg-white border px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateVariation
