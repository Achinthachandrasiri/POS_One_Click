import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExpenseHooks } from '../../hooks/expenseHooks'

// Predefined reasons — selecting "Other" reveals a free-text field
const REASON_OPTIONS = [
  'Rent',
  'Utilities',
  'Salaries',
  'Transport',
  'Maintenance',
  'Stationery',
  'Marketing',
  'Miscellaneous'
]

const inputCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 placeholder-gray-400 p-3 w-full bg-transparent'
const selectCls = 'border-2 border-gray-400 rounded-lg focus:outline-none focus:border-[#1a6b7a] text-sm text-gray-700 p-3 w-full bg-transparent cursor-pointer'
const labelCls = 'text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block'
const errorCls = 'text-red-600 text-xs mt-1'

const todayStr = () => new Date().toISOString().split('T')[0]

// Converts any date shape (ISO string, Date, etc.) coming back from the
// backend into the yyyy-mm-dd format the <input type="date"> needs.
const toDateInputValue = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const EditExpenses = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getExpenseById, updateExpense, loading } = useExpenseHooks()

  const [form, setForm] = useState({
    date: '',
    reason: '',
    customReason: '',
    amount: '',
    note: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [initializing, setInitializing] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadExpense = async () => {
      setInitializing(true)
      const res = await getExpenseById(id)

      if (!isMounted) return

      if (!res?.success || !res?.expense) {
        setNotFound(true)
        setInitializing(false)
        return
      }

      const exp = res.expense
      const isKnownReason = REASON_OPTIONS.includes(exp.reason)

      setForm({
        date: toDateInputValue(exp.date),
        reason: isKnownReason ? exp.reason : 'Other',
        customReason: isKnownReason ? '' : (exp.reason || ''),
        amount: exp.amount ?? '',
        note: exp.note || ''
      })
      setInitializing(false)
    }

    if (id) {
      loadExpense()
    } else {
      setNotFound(true)
      setInitializing(false)
    }

    return () => {
      isMounted = false
    }
  }, [id, getExpenseById])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errors = {}
    if (!form.date) errors.date = 'Date is required'
    if (!form.reason) {
      errors.reason = 'Reason is required'
    } else if (form.reason === 'Other' && !form.customReason.trim()) {
      errors.customReason = 'Please enter a reason'
    }
    if (!form.amount || Number(form.amount) <= 0) errors.amount = 'Enter a valid amount'
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

    const finalReason = form.reason === 'Other' ? form.customReason.trim() : form.reason

    const res = await updateExpense({
      id,
      date: form.date,
      reason: finalReason,
      amount: Number(form.amount),
      note: form.note.trim()
    })

    if (res?.success) {
      navigate('/dashboard/expenses')
    } else if (res?.fieldErrors) {
      setFieldErrors(res.fieldErrors)
    } else {
      setFormError(res?.error || 'Failed to update expense. Please try again.')
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
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Expense</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update expense records</p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-7 py-[10px] shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >

          {initializing ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">
              <i className="fas fa-spinner fa-spin mr-2" /> Loading expense…
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-sm text-gray-600">This expense could not be found. It may have been deleted.</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/expenses')}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90"
              >
                Back to Expenses
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-2xl mt-6">

              {formError && (
                <div className="mb-4 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
                  <i className="fas fa-exclamation-triangle mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    max={todayStr()}
                    className={inputCls}
                  />
                  {fieldErrors.date && <p className={errorCls}>{fieldErrors.date}</p>}
                </div>

                <div>
                  <label className={labelCls}>Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    className={inputCls}
                  />
                  {fieldErrors.amount && <p className={errorCls}>{fieldErrors.amount}</p>}
                </div>
              </div>

              <div className="mt-5">
                <label className={labelCls}>Reason</label>
                <select
                  value={form.reason}
                  onChange={(e) => updateField('reason', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select a reason…</option>
                  {REASON_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.reason && <p className={errorCls}>{fieldErrors.reason}</p>}
              </div>

              {form.reason === 'Other' && (
                <div className="mt-5">
                  <label className={labelCls}>Specify reason</label>
                  <input
                    type="text"
                    placeholder="Enter the reason…"
                    value={form.customReason}
                    onChange={(e) => updateField('customReason', e.target.value)}
                    className={inputCls}
                    autoFocus
                  />
                  {fieldErrors.customReason && <p className={errorCls}>{fieldErrors.customReason}</p>}
                </div>
              )}

              <div className="mt-5">
                <label className={labelCls}>Note <span className="normal-case text-gray-400 font-medium">(optional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Any additional details…"
                  value={form.note}
                  onChange={(e) => updateField('note', e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex gap-3 mt-7">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/expenses')}
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
                  {loading ? (<><i className="fas fa-spinner fa-spin" /> Saving…</>) : (<><i className="fas fa-check" /> Save Changes</>)}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}

export default EditExpenses
