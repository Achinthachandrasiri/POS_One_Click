import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOfferHooks } from '../../hooks/useOfferHooks'

const dateFmt = (d) => (d ? new Date(d).toLocaleDateString('en-CA') : '-')

const idStr = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (v.$oid) return v.$oid
    if (typeof v.toString === 'function') return v.toString()
  }
  return String(v)
}

const isExpired = (endDate) => {
  if (!endDate) return false
  const end = new Date(endDate)
  if (Number.isNaN(end.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return end < today
}

const inputCls =
  'border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 bg-transparent'

const ViewOffer = () => {
  const navigate = useNavigate()
  const { getAllOffers, deleteOffer, loading, error } = useOfferHooks()

  const [offers, setOffers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadOffers = async () => {
      const res = await getAllOffers({ includeDeleted: false })
      if (res?.success) {
        setOffers(res.offers || [])
      }
    }

    loadOffers()
  }, [getAllOffers])

  const filteredOffers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return offers

    return offers.filter((o) => {
      const haystack = `${o.offer_name || ''} ${o.created_by || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [offers, search])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Move this offer to recycle bin?')
    if (!confirmDelete) return

    const res = await deleteOffer(id)
    if (res?.success) {
      setOffers((prev) => prev.filter((o) => idStr(o._id) !== idStr(id)))
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
          <h1 className="text-white text-[22px] font-semibold m-0">Offers</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Manage discount offers</p>
        </div>

        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <div className="flex flex-wrap items-end gap-3 mt-4">
              <input
                type="text"
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} w-72`}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate('/dashboard/offers/create')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-md px-6 py-3 rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                + Add Offer
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

          <div className="border border-gray-200 rounded overflow-auto max-h-[60vh]">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5fbfd] text-[#2a5b67] text-xs">
                  <th className="text-left px-3 py-2 border-b">Offer Name</th>
                  <th className="text-left px-3 py-2 border-b">Percentage</th>
                  <th className="text-left px-3 py-2 border-b">Created By</th>
                  <th className="text-left px-3 py-2 border-b">End Date</th>
                  <th className="text-right px-3 py-2 border-b">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOffers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500 text-xs">
                      No offers found
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => (
                    <tr key={idStr(offer._id)} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{offer.offer_name || '-'}</td>

                      <td className="px-3 py-2">
                        <span className="inline-block min-w-[92px] text-center px-3 py-1.5 rounded-md bg-[#d9f7ea] text-[#10b981] font-semibold">
                          {String(offer.percentage).padStart(2, '0')} %
                        </span>
                      </td>

                      <td className="px-3 py-2 text-gray-700">{offer.created_by || '-'}</td>

                      <td className="px-3 py-2 text-gray-700">
                        {dateFmt(offer.end_date)}
                        {isExpired(offer.end_date) && (
                          <span className="ml-2 inline-block rounded-full bg-[#ffe7e7] text-[#ef4444] px-2 py-0.5 text-[11px] font-semibold">
                            Expired
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2 justify-end w-full">
                          <button
                            onClick={() => navigate(`/dashboard/offers/edit/${idStr(offer._id)}`)}
                            className="bg-white text-blue-500 text-sm px-3 py-1 rounded hover:opacity-90"
                            title="Edit"
                          >
                            <i className="fas fa-pen" />
                          </button>

                          <button
                            onClick={() => handleDelete(offer._id)}
                            className="bg-white text-red-500 text-sm px-3 py-1 rounded hover:opacity-90"
                            title="Delete"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewOffer
