import { useState } from 'react'

const CreateUserPage = () => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    role: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await window.api.user.create(form)

      if (res?.success) {
        setSuccess('User created successfully!')
        setForm({ first_name: '', last_name: '', email: '', mobile: '', password: '', role: '' })
      } else if (res?.fieldErrors) {
        setFieldErrors(res.fieldErrors)
      } else {
        setError(res?.error || 'Something went wrong.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      {/* Background */}
      <svg style={styles.bgSvg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      {/* Card */}
      <div style={styles.card}>
        <h2 style={styles.title}>Create User</h2>
        <p style={styles.subtitle}>Fill in all fields to create a new account</p>

        <form onSubmit={handleSubmit}>
          {/* Row 1 — First & Last Name */}
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>First Name</label>
              <input
                style={styles.input}
                name="first_name"
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
              />
              {fieldErrors.first_name && <div style={styles.error}>{fieldErrors.first_name}</div>}
            </div>

            <div style={{ width: 24 }} />

            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Last Name</label>
              <input
                style={styles.input}
                name="last_name"
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
              />
              {fieldErrors.last_name && <div style={styles.error}>{fieldErrors.last_name}</div>}
            </div>
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              name="email"
              type="email"
              placeholder="john.doe@gmail.com"
              value={form.email}
              onChange={handleChange}
            />
            {fieldErrors.email && <div style={styles.error}>{fieldErrors.email}</div>}
          </div>

          {/* Mobile */}
          <div style={styles.field}>
            <label style={styles.label}>Mobile Number</label>
            <input
              style={styles.input}
              name="mobile"
              type="text"
              placeholder="0771234567"
              maxLength={10}
              value={form.mobile}
              onChange={handleChange}
            />
            {fieldErrors.mobile && <div style={styles.error}>{fieldErrors.mobile}</div>}
          </div>

          {/* Row 2 — Role & Password */}
          <div style={styles.row}>
            {/* Role */}
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Role</label>
              <select
                style={{ ...styles.input, cursor: 'pointer' }}
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="">Select role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              {fieldErrors.role && <div style={styles.error}>{fieldErrors.role}</div>}
            </div>

            <div style={{ width: 24 }} />

            {/* Password */}
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  style={{ ...styles.input, paddingRight: 36 }}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="x x x x x x x x"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && <div style={styles.error}>{fieldErrors.password}</div>}
            </div>
          </div>

          {/* Global error / success */}
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {/* Submit */}
          <button
            type="submit"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>

        <p style={styles.footer}>
          Powered by <strong>Alpha Devs</strong>
        </p>
      </div>
    </div>
  )
}

const TEAL = '#1a6b7a'

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#225166',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif"
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
    padding: '40px 56px 36px',
    width: '100%',
    maxWidth: 680,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#222',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 28
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  field: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
    display: 'block'
  },
  input: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #ccc',
    outline: 'none',
    fontSize: 15,
    padding: '6px 0',
    background: 'transparent',
    boxSizing: 'border-box'
  },
  passwordWrapper: {
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    marginTop: 10,
    background: TEAL,
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 16,
    cursor: 'pointer'
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#777'
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 6
  },
  success: {
    color: '#1a6b7a',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 6
  }
}

export default CreateUserPage
