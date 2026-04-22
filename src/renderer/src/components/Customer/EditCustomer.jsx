import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomerHooks } from '../../hooks/customerHooks'

const EditCustomer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    error,
    fieldErrors,
    setError,
    setFieldErrors,
    getCustomerById,
    updateCustomer
  } = useCustomerHooks()

  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
    nicNumber: '',
    address: ''
  })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadCustomer = async () => {
      const res = await getCustomerById(id)
      if (res?.success && res.customer) {
        setForm({
          name: res.customer.name || '',
          mobileNumber: res.customer.mobileNumber || '',
          nicNumber: res.customer.nicNumber || '',
          address: res.customer.address || ''
        })
      }
    }

    loadCustomer()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')

    const res = await updateCustomer(id, form)
    if (res?.success) {
      setSuccess('Customer updated successfully')
      setTimeout(() => navigate('/customers/view'), 500)
    }
  }

  return (
    <div style={styles.root}>
      <svg style={styles.bgSvg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      <div style={styles.card}>
        <h2 style={styles.title}>Edit Customer</h2>
        <p style={styles.subtitle}>Update customer details</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input style={styles.input} type="text" name="name" value={form.name} onChange={handleChange} />
            {fieldErrors.name && <div style={styles.error}>{fieldErrors.name}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mobile Number</label>
            <input
              style={styles.input}
              type="text"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              maxLength={10}
            />
            {fieldErrors.mobileNumber && <div style={styles.error}>{fieldErrors.mobileNumber}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>NIC Number</label>
            <input
              style={styles.input}
              type="text"
              name="nicNumber"
              value={form.nicNumber}
              onChange={handleChange}
              maxLength={12}
            />
            {fieldErrors.nicNumber && <div style={styles.error}>{fieldErrors.nicNumber}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Address</label>
            <textarea
              style={{ ...styles.input, minHeight: 90, resize: 'vertical' }}
              name="address"
              value={form.address}
              onChange={handleChange}
            />
            {fieldErrors.address && <div style={styles.error}>{fieldErrors.address}</div>}
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <div style={styles.actions}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.secondaryBtn }}
              onClick={() => navigate('/customers/view')}
            >
              Cancel
            </button>
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#225166',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
    padding: 16
  },
  bgSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: '#fff',
    borderRadius: 4,
    padding: '28px 32px',
    width: '100%',
    maxWidth: 560,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
  },
  title: {
    margin: 0,
    color: '#1a6b7a'
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: '#666',
    fontSize: 13
  },
  field: {
    marginBottom: 14
  },
  label: {
    display: 'block',
    marginBottom: 6,
    color: '#444',
    fontSize: 13,
    fontWeight: 600
  },
  input: {
    width: '100%',
    border: '1px solid #d9e3e6',
    borderRadius: 4,
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none'
  },
  error: {
    color: '#c0392b',
    fontSize: 12,
    marginTop: 6
  },
  success: {
    color: '#1e824c',
    fontSize: 12,
    marginTop: 6
  },
  actions: {
    marginTop: 18,
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end'
  },
  btn: {
    border: 'none',
    borderRadius: 4,
    background: '#2699aa',
    color: '#fff',
    padding: '10px 14px',
    fontSize: 13,
    cursor: 'pointer'
  },
  secondaryBtn: {
    background: '#0e5a6a'
  }
}

export default EditCustomer
