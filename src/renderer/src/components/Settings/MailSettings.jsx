import { useState, useEffect } from 'react'

// ─── Design tokens (mirrors CreateProduct & GeneralSettings) ─
const C = {
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

const MAILER_OPTIONS = ['SMTP', 'SendGrid', 'Mailgun', 'Amazon SES']
const PORT_OPTIONS   = [
  { value: '587', label: '587 — TLS' },
  { value: '465', label: '465 — SSL' },
]

const initialForm = () => ({
  mail_mailer: '',
  mail_host: '',
  mail_port: '',
  mail_sender_name: '',
  mail_username: '',
})

// ─────────────────────────────────────────────────────────────
const MailSettings = () => {
  const [form, setForm]               = useState(initialForm())
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [loading, setLoading]         = useState(false)

  // Load existing settings on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await window.api.settings.getMail()
        if (res?.data) setForm({ ...initialForm(), ...res.data })
      } catch (e) {
        console.error('Failed to load mail settings', e)
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
    if (!form.mail_mailer)              errs.mail_mailer      = 'Mail mailer is required'
    if (!form.mail_host.trim())         errs.mail_host        = 'Mail host is required'
    if (!form.mail_port)                errs.mail_port        = 'Mail port is required'
    if (!form.mail_sender_name.trim())  errs.mail_sender_name = 'Sender name is required'
    if (!form.mail_username.trim())     errs.mail_username    = 'Username is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail_username))
      errs.mail_username = 'Enter a valid email address'
    return errs
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setLoading(true)
    try {
      const res = await window.api.settings.saveMail(form)
      if (res?.success) {
        setSuccess('Mail settings saved successfully.')
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
            <i className="fas fa-envelope text-[20px]" /> Mail Settings
          </h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">
            Configure the mail server used for sending system emails and notifications.
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

          {/* ── Mail provider ── */}
          <Section title="Mail provider" icon="server">
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Mail mailer"
                required
                error={fieldErrors.mail_mailer}
              >
                <select
                  value={form.mail_mailer}
                  onChange={(e) => updateForm('mail_mailer', e.target.value)}
                  className={selectCls(fieldErrors.mail_mailer)}
                >
                  <option value="">Select mailer</option>
                  {MAILER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>

              <Field
                label="Mail host"
                required
                error={fieldErrors.mail_host}
              >
                <input
                  type="text"
                  value={form.mail_host}
                  onChange={(e) => updateForm('mail_host', e.target.value)}
                  placeholder="e.g. smtp.gmail.com"
                  className={inputCls(fieldErrors.mail_host)}
                />
              </Field>

              <Field
                label="Mail port"
                required
                error={fieldErrors.mail_port}
              >
                <select
                  value={form.mail_port}
                  onChange={(e) => updateForm('mail_port', e.target.value)}
                  className={selectCls(fieldErrors.mail_port)}
                >
                  <option value="">Select port</option>
                  {PORT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Sender identity ── */}
          <Section title="Sender identity" icon="user-pen">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Mail sender name"
                required
                error={fieldErrors.mail_sender_name}
              >
                <input
                  type="text"
                  value={form.mail_sender_name}
                  onChange={(e) => updateForm('mail_sender_name', e.target.value)}
                  placeholder="e.g. MyPOS Support"
                  className={inputCls(fieldErrors.mail_sender_name)}
                />
              </Field>

              <Field
                label="Mail username"
                required
                error={fieldErrors.mail_username}
              >
                <input
                  type="email"
                  value={form.mail_username}
                  onChange={(e) => updateForm('mail_username', e.target.value)}
                  placeholder="e.g. noreply@company.com"
                  className={inputCls(fieldErrors.mail_username)}
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

export default MailSettings