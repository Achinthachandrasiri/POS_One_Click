import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import useCashSessionHooks from '../../hooks/useCashSessionHooks'
import { getDeviceId } from '../../utils/deviceId'

const Header = ({ user }) => {
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [posError, setPosError] = useState('')
  const [checking, setChecking] = useState(false)

  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [loadingStores, setLoadingStores] = useState(false)

  const { loading, checkActiveSession, openSession } = useCashSessionHooks()

  const loadStores = async () => {
    setLoadingStores(true)
    try {
      const storeRes = await window.api.store.getAll()
      const storeList = storeRes.stores || storeRes.data || []
      setStores(storeList)
      if (storeList.length === 1) {
        setSelectedStoreId(storeList[0]._id)
      }
    } catch (err) {
      console.error('Failed to load stores:', err)
    } finally {
      setLoadingStores(false)
    }
  }

  const handlePosClick = async () => {
    setPosError('')
    setChecking(true)
    const deviceId = getDeviceId()

    const result = await checkActiveSession(deviceId)
    setChecking(false)

    if (!result.success) {
      setPosError(result.error || 'Failed to check active session')
      return
    }

    if (result.data) {
      // An active session already exists on this device — go straight into
      // POS with it instead of asking to open a new one.
      navigate('/pos', { state: { session: result.data } })
      return
    }

    // No active session on this device — collect opening cash + store first.
    await loadStores()
    setShowModal(true)
  }

  const handleConfirmOpen = async () => {
    setPosError('')

    const amount = parseFloat(openingCash)
    if (isNaN(amount) || amount < 0) {
      setPosError('Please enter a valid opening cash amount')
      return
    }

    if (!selectedStoreId) {
      setPosError('Please select a store for this session')
      return
    }

    const result = await openSession({
      deviceId: getDeviceId(),
      deviceName: 'Counter 1', // TODO: make this configurable per device
      storeId: selectedStoreId,
      openingCash: amount
    })

    if (!result.success) {
      setPosError(result.error || 'Failed to open cash session')
      return
    }

    setShowModal(false)
    setOpeningCash('')
    setSelectedStoreId('')
    navigate('/pos', { state: { session: result.data } })
  }

  return (
    <header className="flex items-center z-50 justify-between px-8 py-5 bg-[#ffffff0d] border-b border-[#ffffff18]">
      <div>
        <h1 className="text-white text-[20px] font-semibold m-0">Dashboard</h1>
        <p className="text-[#90bcc4] text-[13px] mt-1">
          Welcome back! Here's what's happening.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePosClick}
          disabled={checking}
          className="flex items-center gap-2 bg-[#1a6b7a] hover:bg-[#2699aa] disabled:opacity-60 text-white text-[14px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <FiShoppingCart size={16} />
          {checking ? 'Checking...' : 'POS'}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a6b7a] flex items-center justify-center text-white font-bold">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-[#cce6ea] text-[14px]">
            {user?.username ?? 'User'}
          </span>
        </div>
      </div>

      {posError && !showModal && (
        <div className="absolute top-full right-8 mt-2 bg-[#3a1a1a] border border-[#7a2e2e] text-[#f2b8b8] text-[13px] px-4 py-2 rounded-lg shadow-lg max-w-sm">
          {posError}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-[#0f2b30] border border-[#ffffff18] rounded-xl p-6 w-[380px]">
            <h2 className="text-white text-[18px] font-semibold mb-1">Open Cash Session</h2>
            <p className="text-[#90bcc4] text-[13px] mb-4">
              Enter the cash amount you're starting with in the till.
            </p>

            <label className="text-[#cce6ea] text-[13px] block mb-1">Store</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={loadingStores}
              className="w-full bg-[#ffffff0d] border border-[#ffffff18] text-white rounded-lg px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#2699aa]"
            >
              <option value="" className="bg-[#0f2b30]">
                {loadingStores ? 'Loading stores...' : 'Select a store'}
              </option>
              {stores.map((store) => (
                <option key={store._id} value={store._id} className="bg-[#0f2b30]">
                  {store.name || store.store_name}
                </option>
              ))}
            </select>

            <label className="text-[#cce6ea] text-[13px] block mb-1">Opening Cash (Rs.)</label>
            <input
              type="number"
              min="0"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#ffffff0d] border border-[#ffffff18] text-white rounded-lg px-3 py-2 text-[14px] mb-3 outline-none focus:border-[#2699aa]"
            />

            {posError && (
              <p className="text-[#f2b8b8] text-[13px] mb-3">{posError}</p>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setOpeningCash('')
                  setSelectedStoreId('')
                  setPosError('')
                }}
                className="px-4 py-2 rounded-lg text-[14px] text-[#cce6ea] hover:bg-[#ffffff0d]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOpen}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-[14px] bg-[#1a6b7a] hover:bg-[#2699aa] disabled:opacity-60 text-white font-medium"
              >
                {loading ? 'Opening...' : 'Open Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
