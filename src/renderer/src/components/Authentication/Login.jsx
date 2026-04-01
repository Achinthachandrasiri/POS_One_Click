import { useState } from 'react'
import {Link} from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'

const LoginPage = () => {
  const { username, setUsername, password, setPassword, error, fieldErrors, loading, handleLogin } =
    useLogin()

  const [showPassword, setShowPassword] = useState(false)

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
        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="email"
              placeholder="alphadevs.user@gmail.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {fieldErrors.username && <div style={styles.error}>{fieldErrors.username}</div>}
          </div>

          {/* Reset Password */}
          <div style={styles.resetRow}>
            <Link to="/reset-password" style={styles.resetLink}>
              Reset Password
            </Link>
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>

            <div style={styles.passwordWrapper}>
              <input
                style={{ ...styles.input, paddingRight: 36 }}
                type={showPassword ? 'text' : 'password'}
                placeholder="x x x x x x x x"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Global Error */}
          {error && <div style={styles.error}>{error}</div>}

          {/* Login Button */}
          <button
            type="submit"
            style={{
              ...styles.loginBtn,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Footer */}
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
    padding: '48px 56px 36px',
    width: '100%',
    maxWidth: 580,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
  },
  field: {
    marginBottom: 10
  },
  label: {
    fontSize: 15,
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
    background: 'transparent'
  },
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20
  },
  resetLink: {
    background: 'none',
    border: 'none',
    color: TEAL,
    cursor: 'pointer',
    fontSize: 14
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
  loginBtn: {
    width: '100%',
    padding: '14px 0',
    marginTop: 25,
    background: TEAL,
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 16,
    cursor: 'pointer'
  },
  footer: {
    marginTop: 25,
    fontSize: 13,
    color: '#777'
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 6
  }
}

export default LoginPage
