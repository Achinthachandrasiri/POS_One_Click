import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useResetPassword } from '../../hooks/useResetPassword'

const TEAL = '#1a6b7a'

const ResetPassword = () => {
  const {
    username, setUsername,
    otp,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    step, loading, error, fieldErrors,
    inputRefs,
    countdown, attemptsLeft, blocked,
    formatTime,
    handleSendOtp, handleVerifyOtp, handleChangePassword,
    handleOtpChange, handleOtpKeyDown,
    handleResend, goBack,
  } = useResetPassword()

  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-[Segoe_UI,sans-serif]"
      style={{ backgroundColor: '#225166' }}>

      {/* Background SVG */}
      <svg
        className="absolute w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-[4px] px-14 pt-12 pb-9 w-full shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
        style={{ maxWidth: 580, height: 460 }}>
        <div className="h-full flex flex-col">

          {/* ── Step: Email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="flex flex-col justify-between min-h-[340px]">
              <div>
                <h2 className="text-[22px] font-medium text-[#222] m-0 mb-1.5">Reset password</h2>
                <p className="text-sm text-[#777] m-0 mb-4">Enter your Gmail to receive a one-time code.</p>

                <div className="mb-5">
                  <label className="text-[15px] text-[#222] mb-2 block">Username</label>
                  <input
                    className="w-full border-0 border-b border-b-[#ccc] border-b-[1.5px] outline-none text-[15px] py-1.5 bg-transparent"
                    type="email"
                    placeholder="alphadevs.user@gmail.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {fieldErrors.username && (
                    <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{fieldErrors.username}</div>
                  )}
                </div>

                {error && <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{error}</div>}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-3.5 text-white border-0 rounded-[3px] text-base cursor-pointer font-[Segoe_UI,sans-serif] transition-opacity"
                  style={{ backgroundColor: TEAL, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>

                <div className="mt-6 flex items-center justify-between">
                  <Link to="/" className="bg-transparent border-0 cursor-pointer text-sm p-0 no-underline"
                    style={{ color: TEAL }}>
                    ← Back to login
                  </Link>
                  <p className="text-[13px] text-[#777] m-0">Powered by <strong>Alpha Devs</strong></p>
                </div>
              </div>
            </form>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col justify-between min-h-[340px]">
              <div>
                <h2 className="text-[22px] font-medium text-[#222] m-0 mb-1.5">Enter OTP</h2>
                <p className="text-sm text-[#777] m-0 mb-4">
                  A 6-digit code was sent to{' '}
                  <span className="font-medium" style={{ color: TEAL }}>{username}</span>
                </p>

                {/* Countdown + Attempts row */}
                <div className="flex justify-between items-center mb-4">
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: countdown <= 60 ? '#c0392b' : TEAL }}
                  >
                    ⏱ {formatTime(countdown)}
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ color: attemptsLeft === 1 ? '#c0392b' : '#888' }}
                  >
                    {blocked ? 'No attempts left' : `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`}
                  </span>
                </div>

                <div className="flex gap-3 justify-center mb-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      className="w-11 h-[52px] border-0 border-b-2 text-center text-[22px] font-medium text-[#222] bg-transparent outline-none font-[Segoe_UI,sans-serif] transition-colors duration-200"
                      style={{
                        borderBottomColor: blocked ? '#c0392b' : '#ccc',
                        opacity: blocked ? 0.5 : 1,
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={blocked}
                    />
                  ))}
                </div>

                {error && <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{error}</div>}

                <div className="flex justify-center mt-3">
                  <button
                    type="button"
                    className="bg-transparent border-0 cursor-pointer text-sm p-0 font-[Segoe_UI,sans-serif] transition-opacity"
                    style={{ color: TEAL, opacity: loading ? 0.5 : 1 }}
                    onClick={handleResend}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-3.5 text-white border-0 rounded-[3px] text-base font-[Segoe_UI,sans-serif] transition-opacity"
                  style={{
                    backgroundColor: TEAL,
                    opacity: loading || blocked ? 0.6 : 1,
                    cursor: blocked ? 'not-allowed' : 'pointer',
                  }}
                  disabled={loading || blocked}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    className="bg-transparent border-0 cursor-pointer text-sm p-0 font-[Segoe_UI,sans-serif]"
                    style={{ color: TEAL }}
                    onClick={goBack}
                  >
                    ← Back
                  </button>
                  <p className="text-[13px] text-[#777] m-0">Powered by <strong>Alpha Devs</strong></p>
                </div>
              </div>
            </form>
          )}

          {/* ── Step: New Password ── */}
          {step === 'newPassword' && (
            <form onSubmit={handleChangePassword} className="flex flex-col justify-between min-h-[340px]">
              <div>
                <h2 className="text-[22px] font-medium text-[#222] m-0 mb-1.5">New password</h2>
                <p className="text-sm text-[#777] m-0 mb-4">Choose a strong password for your account.</p>

                <div className="mb-5">
                  <label className="text-[15px] text-[#222] mb-2 block">New password</label>
                  <div className="relative">
                    <input
                      className="w-full border-0 border-b border-b-[#ccc] border-b-[1.5px] outline-none text-[15px] py-1.5 bg-transparent pr-9"
                      type={showNew ? 'text' : 'password'}
                      placeholder="x x x x x x x x"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0"
                      onClick={() => setShowNew(v => !v)}
                    >
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{fieldErrors.newPassword}</div>
                  )}
                </div>

                <div className="mb-5">
                  <label className="text-[15px] text-[#222] mb-2 block">Confirm password</label>
                  <div className="relative">
                    <input
                      className="w-full border-0 border-b border-b-[#ccc] border-b-[1.5px] outline-none text-[15px] py-1.5 bg-transparent pr-9"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="x x x x x x x x"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0"
                      onClick={() => setShowConfirm(v => !v)}
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{fieldErrors.confirmPassword}</div>
                  )}
                </div>

                {error && <div className="text-[#c0392b] text-[13px] mt-1.5 mb-1">{error}</div>}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-3.5 text-white border-0 rounded-[3px] text-base cursor-pointer font-[Segoe_UI,sans-serif] transition-opacity"
                  style={{ backgroundColor: TEAL, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Change password'}
                </button>

                <div className="mt-6 flex items-center justify-between">
                  <span />
                  <p className="text-[13px] text-[#777] m-0">Powered by <strong>Alpha Devs</strong></p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
