import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useResetPassword } from '../../hooks/useResetPassword'

const ResetPassword = () => {
  const {
    username, setUsername,
    otp,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    step, loading, error, fieldErrors,
    inputRefs,
    handleSendOtp, handleVerifyOtp, handleChangePassword,
    handleOtpChange, handleOtpKeyDown,
    handleResend, goBack,
  } = useResetPassword()

  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

        {/* ── Step: Email ── */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <h2 style={styles.title}>Reset password</h2>
            <p style={styles.subtitle}>Enter your Gmail to receive a one-time code.</p>

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

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ── Step: OTP ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <h2 style={styles.title}>Enter OTP</h2>
            <p style={styles.subtitle}>
              A 6-digit code was sent to{' '}
              <span style={styles.emailHighlight}>{username}</span>
            </p>

            <div style={styles.otpRow}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  style={styles.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div style={styles.resendRow}>
              <button type="button" style={styles.linkBtn} onClick={handleResend} disabled={loading}>
                Resend code
              </button>
            </div>
          </form>
        )}

        {/* ── Step: New Password ── */}
        {step === 'newPassword' && (
          <form onSubmit={handleChangePassword}>
            <h2 style={styles.title}>New password</h2>
            <p style={styles.subtitle}>Choose a strong password for your account.</p>

            <div style={styles.field}>
              <label style={styles.label}>New password</label>
              <div style={styles.passwordWrapper}>
                <input
                  style={{ ...styles.input, paddingRight: 36 }}
                  type={showNew ? 'text' : 'password'}
                  placeholder="x x x x x x x x"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowNew(v => !v)}>
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.newPassword && <div style={styles.error}>{fieldErrors.newPassword}</div>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm password</label>
              <div style={styles.passwordWrapper}>
                <input
                  style={{ ...styles.input, paddingRight: 36 }}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="x x x x x x x x"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.confirmPassword && <div style={styles.error}>{fieldErrors.confirmPassword}</div>}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Change password'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          {step === 'email' && (
            <Link to="/" style={styles.linkBtn}>← Back to login</Link>
          )}
          {step === 'otp' && (
            <button type="button" style={styles.linkBtn} onClick={goBack}>← Back</button>
          )}
          {step === 'newPassword' && (
            <span />
          )}
          <p style={styles.poweredBy}>Powered by <strong>Alpha Devs</strong></p>
        </div>

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
    fontFamily: "'Segoe UI', sans-serif",
  },
  bgSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: '#fff',
    borderRadius: 4,
    padding: '48px 56px 36px',
    width: '100%',
    maxWidth: 580,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    color: '#222',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    margin: '0 0 28px',
  },
  emailHighlight: {
    color: TEAL,
    fontWeight: 500,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
    display: 'block',
  },
  input: {
    width: '100%',
    border: 'none',
    borderBottom: '1.5px solid #ccc',
    outline: 'none',
    fontSize: 15,
    padding: '6px 0',
    background: 'transparent',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  otpRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
  },
  otpBox: {
    width: 44,
    height: 52,
    border: 'none',
    borderBottom: '2px solid #ccc',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 500,
    color: '#222',
    background: 'transparent',
    outline: 'none',
    fontFamily: "'Segoe UI', sans-serif",
  },
  submitBtn: {
    width: '100%',
    padding: '14px 0',
    background: TEAL,
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 16,
    cursor: 'pointer',
    fontFamily: "'Segoe UI', sans-serif",
  },
  resendRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: TEAL,
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    fontFamily: "'Segoe UI', sans-serif",
    textDecoration: 'none',
  },
  footer: {
    marginTop: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poweredBy: {
    fontSize: 13,
    color: '#777',
    margin: 0,
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 4,
  },
}

export default ResetPassword
