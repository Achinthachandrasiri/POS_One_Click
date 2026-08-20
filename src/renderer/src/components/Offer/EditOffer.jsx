import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOfferHooks } from '../../hooks/useOfferHooks'

const inputCls =
  'w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 bg-transparent'
const labelCls = 'text-sm font-semibold text-gray-700 mb-1 block'
const errorCls = 'text-red-600 text-xs mt-1'
const todayStr = () => new Date().toISOString().split('T')[0]

const EditOffer = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getOfferById, updateOffer, loading, error } = useOfferHooks()

  const [form, setForm] = useState({
    offer_name: '',
    percentage: '',
    end_date: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const loadOffer = async () => {
      const res = await getOfferById(id)
      if (res?.success && res.offer) {
        setForm({
          offer_name: res.offer.offer_name || '',
          percentage: String(res.offer.percentage ?? ''),
          end_date: res.offer.end_date || ''
        })
      }
    }

    loadOffer()
  }, [getOfferById, id])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const res = await updateOffer({
      _id: id,
      offer_name: form.offer_name,
      percentage: form.percentage,
      end_date: form.end_date
    })

    if (res?.success) {
      navigate('/dashboard/offers')
      return
    }

    if (res?.fieldErrors) {
      setFieldErrors(res.fieldErrors)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        <div className="relative z-10 mb-5">
          <div>
            <h1 className="text-white text-[22px] font-semibold m-0">Edit Offer</h1>
            <p className="text-[#90bcc4] text-[15px] mt-1">Update offer details</p>
          </div>
        </div>

        <div
          className="relative z-10 bg-white w-full px-7 py-[26px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="max-w-2xl mt-2">
            {error && <p className="text-red-600 text-xs mb-4">{error}</p>}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className={labelCls}>
                  Offer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.offer_name}
                  onChange={handleChange('offer_name')}
                  className={inputCls}
                />
                {fieldErrors.offer_name && <p className={errorCls}>{fieldErrors.offer_name}</p>}
              </div>

              <div>
                <label className={labelCls}>
                  Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.percentage}
                  onChange={handleChange('percentage')}
                  className={inputCls}
                />
                {fieldErrors.percentage && <p className={errorCls}>{fieldErrors.percentage}</p>}
              </div>

              <div>
                <label className={labelCls}>End Date</label>
                <input
                  type="date"
                  min={todayStr()}
                  value={form.end_date}
                  onChange={handleChange('end_date')}
                  className={inputCls}
                />
                {fieldErrors.end_date && <p className={errorCls}>{fieldErrors.end_date}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-8 py-3 rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard/offers')}
                disabled={loading}
                className="border-2 border-gray-300 text-gray-600 text-md px-8 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-60"
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

export default EditOffer
