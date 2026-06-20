import { useState, useEffect } from 'react'

// ─── Design tokens (mirrors CreateProduct) ───────────────────
const C = {
  brand: '#1a6b7a',
  brandLight: '#f0f9fb',
  textPrimary: 'text-gray-900',
  labelText: 'text-gray-700',
  errorText: 'text-red-600',
}

const inputCls = (err) =>
  `border-2 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none w-full transition-colors ${
    err
      ? 'border-red-500 focus:border-red-600 bg-red-50'
      : 'border-gray-300 focus:border-[#1a6b7a] text-gray-900'
  }`

const selectCls = (err) => `${inputCls(err)} cursor-pointer`

const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-sm font-semibold ${C.labelText} flex items-center gap-1`}>
      {label}
      {required && <span className="text-red-500 text-base leading-none">*</span>}
    </label>
    {children}
    {error && (
      <p className={`text-xs font-medium ${C.errorText} flex items-center gap-1`}>
        <i className="fas fa-exclamation-circle text-[11px]" /> {error}
      </p>
    )}
  </div>
)

const Section = ({ title, icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl mb-4 shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b bg-gray-50 border-gray-100 flex items-center gap-2">
      {icon && <i className={`fas fa-${icon} text-[#1a6b7a] text-sm`} />}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// ─────────────────────────────────────────────────────────────
const initialForm = () => ({
  default_store: '',
  hotline: '',
  mobile: '',
  address: '',
  company_name: '',
  email: '',
})

const GeneralSettings = () => {
  const [form, setForm] = useState(initialForm())
  const [stores, setStores] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Load stores + existing settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        const storeRes = await window.api.store.getAll()
        setStores(storeRes?.stores || storeRes?.data || [])

        const settingsRes = await window.api.settings.getGeneral()
        if (settingsRes?.data) {
          setForm({ ...initialForm(), ...settingsRes.data })
        }
      } catch (e) {
        console.error('Failed to load general settings', e)
      }
    }
    load()
  }, [])

  const updateForm = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (fieldErrors[key]) {
      setFieldErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.default_store) errs.default_store = 'Default store is required'
    if (!form.hotline.trim()) errs.hotline = 'Hotline is required'
    if (!form.mobile.trim()) errs.mobile = 'Mobile is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.company_name.trim()) errs.company_name = 'Company name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address'
    return errs
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }
    setLoading(true)
    try {
      const res = await window.api.settings.saveGeneral(form)
      if (res?.success) {
        setSuccess('General settings saved successfully.')
      } else {
        setError(res?.message || 'Failed to save settings.')
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[650px]">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Page header */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-bold m-0 flex items-center gap-2">
            <i className="fas fa-sliders text-[20px]" /> General Settings
          </h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">
            Business information displayed on invoices, receipts, and communications.
          </p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-[#f0f4f6] w-full px-6 py-6 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Error banner */}
          {error && (
            <div className="mb-5 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-exclamation-triangle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success banner */}
          {success && (
            <div className="mb-5 bg-emerald-50 border-2 border-emerald-400 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-circle-check mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* ── Business identity ── */}
          <Section title="Business identity" icon="building">
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Company name"
                required
                error={fieldErrors.company_name}
              >
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => updateForm('company_name', e.target.value)}
                  placeholder="e.g. ABC Retail Solutions (Pvt) Ltd"
                  className={inputCls(fieldErrors.company_name)}
                />
              </Field>

              <Field
                label="Email"
                required
                error={fieldErrors.email}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="e.g. info@company.com"
                  className={inputCls(fieldErrors.email)}
                />
              </Field>

              <Field
                label="Default store"
                required
                error={fieldErrors.default_store}
              >
                <select
                  value={form.default_store}
                  onChange={(e) => updateForm('default_store', e.target.value)}
                  className={selectCls(fieldErrors.default_store)}
                >
                  <option value="">Select store</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.storeName || s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Contact details ── */}
          <Section title="Contact details" icon="phone">
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Hotline"
                required
                error={fieldErrors.hotline}
              >
                <input
                  type="text"
                  value={form.hotline}
                  onChange={(e) => updateForm('hotline', e.target.value)}
                  placeholder="e.g. +94 11 234 5678"
                  className={inputCls(fieldErrors.hotline)}
                />
              </Field>

              <Field
                label="Mobile"
                required
                error={fieldErrors.mobile}
              >
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => updateForm('mobile', e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                  className={inputCls(fieldErrors.mobile)}
                />
              </Field>

              <Field
                label="Address"
                required
                error={fieldErrors.address}
              >
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="e.g. No. 123, Main Street, Colombo 10"
                  className={inputCls(fieldErrors.address)}
                />
              </Field>
            </div>
          </Section>

          {/* ── Action buttons ── */}
          <div className="flex justify-end gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={() => { setForm(initialForm()); setFieldErrors({}); setSuccess(''); setError('') }}
              className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-[#155f6d] disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /> Saving…</>
              ) : (
                <><i className="fas fa-save" /> Save settings</>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default GeneralSettings